import { Server, Socket } from "socket.io";
import {
  createConsultation, addUserMessage, addSystemMessage,
  addClinicalSystemMessage, getLatestMessages, getPatientForConsultation,
} from "@/service/consultation.service";
import { verifyToken } from "@/middleware/auth.middleware";
import { Server as HttpServer } from "http";
import { prisma } from "@/lib/prisma";
import { postJsonToEngine } from "@/lib/engine";

let io: Server;

interface Session {
  consultationId: string;
}

const sessions = new Map<string, Session>();

// ── Live collaboration: room-based presence ──────────────────────────────────
// Multiple participants (e.g. a CHW and a joining doctor) can share one
// consultation room and see each other's messages and presence in real time.

interface Participant {
  userId: string;
  socketId: string;
  name: string;
  role: string;
}

// consultationId -> (socketId -> Participant)
const rooms = new Map<string, Map<string, Participant>>();

const roomName = (consultationId: string) => `consultation:${consultationId}`;

const addParticipant = (consultationId: string, p: Participant) => {
  const room = rooms.get(consultationId) ?? new Map<string, Participant>();
  room.set(p.socketId, p);
  rooms.set(consultationId, room);
};

const removeParticipant = (socketId: string) => {
  for (const [consultationId, room] of rooms) {
    if (room.delete(socketId)) {
      if (room.size === 0) rooms.delete(consultationId);
      return consultationId;
    }
  }
  return undefined;
};

// Distinct participants by user (a user may have multiple sockets/tabs)
const getPresence = (consultationId: string) => {
  const room = rooms.get(consultationId);
  if (!room) return [];
  const byUser = new Map<string, { userId: string; name: string; role: string }>();
  for (const p of room.values()) {
    byUser.set(p.userId, { userId: p.userId, name: p.name, role: p.role });
  }
  return [...byUser.values()];
};

const broadcastPresence = (consultationId: string) => {
  io.to(roomName(consultationId)).emit("presence", {
    consultationId,
    participants: getPresence(consultationId),
  });
};

/**
 * A user may access a consultation if they own it (consultant) or they belong
 * to the same organization as the patient — this is what lets a doctor join a
 * case a CHW started (PRD live-collaboration goal).
 */
const canAccessConsultation = async (
  userOrgId: string | null,
  userId: string,
  consultation: { consultantId: string | null; patientId: string | null }
): Promise<boolean> => {
  if (consultation.consultantId === userId) return true;
  if (!consultation.patientId) return false;
  const patient = await prisma.patient.findUnique({
    where: { id: consultation.patientId },
    select: { organizationId: true },
  });
  return !!patient && !!userOrgId && patient.organizationId === userOrgId;
};

const getTriageResponse = async (
  message: string,
  manual_context: string,
  _patientId: string
): Promise<{ triageData: any; error: boolean }> => {
  try {
    const triageData = await postJsonToEngine("/triage/process_text/", {
      transcript_text: message,
      manual_context,
    });
    return { triageData, error: false };
  } catch (error) {
    return { triageData: error, error: true };
  }
};

const getClinicalSupportResponse = async (
  message: string,
  manual_context: string,
  patientId: string
): Promise<{ clinicalData: any; error: boolean }> => {
  try {
    const clinicalData = await postJsonToEngine(
      `/clinical_support/process_text/${patientId}`,
      { transcript_text: message, manual_context }
    );
    return { clinicalData, error: false };
  } catch (error) {
    return { clinicalData: error, error: true };
  }
};

export function startSocketServer(server: HttpServer): void {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false,
  });

  io.on("connection", async (socket: Socket) => {
    socket.emit("info", "A connection is made");

    let userId: string | undefined;
    const token = socket.handshake.query.token as string;
    const consultationId = socket.handshake.query.consultationId as string;
    const patientId = socket.handshake.query.patientId as string;

    if (!token) {
      socket.emit("info", "Authentication required. Please provide a valid token.");
      socket.disconnect();
      return;
    }

    try {
      userId = await verifyToken(token);
    } catch {
      socket.emit("info", "Token verification failed. Invalid or expired token.");
      socket.disconnect();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, role: true, organizationId: true },
    });
    if (!user) { socket.emit("info", "User not found."); socket.disconnect(); return; }
    const displayName = `${user.firstName} ${user.lastName}`.trim() || "Unknown";

    // Join a consultation room: register presence and announce to other members.
    const joinRoom = async (cid: string) => {
      socket.join(roomName(cid));
      sessions.set(socket.id, { consultationId: cid });
      addParticipant(cid, { userId: user.id, socketId: socket.id, name: displayName, role: user.role });
      socket.emit("consultationId", cid);
      socket.to(roomName(cid)).emit("participantJoined", { userId: user.id, name: displayName, role: user.role });
      broadcastPresence(cid);
      socket.emit("recentMessages", await getLatestMessages(cid));
    };

    if (consultationId && consultationId !== "undefined") {
      const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
      if (!consultation) { socket.emit("info", "Consultation not found."); socket.disconnect(); return; }
      if (!(await canAccessConsultation(user.organizationId, userId, consultation))) {
        socket.emit("info", "You don't have access to this consultation.");
        socket.disconnect();
        return;
      }
    }

    if (patientId && patientId !== "undefined") {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) { socket.emit("info", "Patient not found."); socket.disconnect(); return; }
    }

    if (!consultationId || consultationId === "undefined") {
      // New consultation will be created on startConsultation event
    } else {
      const patient = await getPatientForConsultation(consultationId);
      socket.emit("info", `Welcome back! Continuing consultation for ${patient?.firstName} ${patient?.lastName}.`);
      await joinRoom(consultationId);
    }

    // A clinician (e.g. doctor) joins an existing case started by someone else.
    socket.on("joinConsultation", async (data: { consultationId: string }) => {
      const cid = data?.consultationId;
      if (!cid) { socket.emit("info", "consultationId is required to join."); return; }
      const consultation = await prisma.consultation.findUnique({ where: { id: cid } });
      if (!consultation) { socket.emit("info", "Consultation not found."); return; }
      if (!(await canAccessConsultation(user.organizationId, userId!, consultation))) {
        socket.emit("info", "You don't have access to this consultation.");
        return;
      }
      await joinRoom(cid);
    });

    socket.on("message", async (data: { transcript_text: string; manual_context: string; triage: boolean }) => {
      const session = sessions.get(socket.id);
      if (!session) { socket.emit("info", "Session not found. Please reconnect."); return; }
      const room = roomName(session.consultationId);

      const userMessage = await addUserMessage(session.consultationId, data.transcript_text);
      io.to(room).emit("message", userMessage);

      if (data.triage) {
        const { triageData, error } = await getTriageResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("errorMessage", "Error processing your request. Please try again."); return; }
        io.to(room).emit("response", await addSystemMessage(session.consultationId, triageData));
      } else {
        const { clinicalData, error } = await getClinicalSupportResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("errorMessage", "Error processing your request. Please try again."); return; }
        io.to(room).emit("response", await addClinicalSystemMessage(session.consultationId, clinicalData));
      }

      io.to(room).emit("recentMessages", await getLatestMessages(session.consultationId));
    });

    socket.on("startConsultation", async (data: { transcript_text: string; manual_context: string; triage: boolean }) => {
      if (consultationId && consultationId !== "undefined") {
        socket.emit("info", "You already have a consultation. You aren't allowed to start a new one.");
        socket.disconnect();
        return;
      }

      socket.emit("info", "Creating a new consultation for you...");
      const consultation = await createConsultation(userId!, patientId);
      const newConsultationId = consultation.id;
      await joinRoom(newConsultationId);
      const room = roomName(newConsultationId);

      const userMessage = await addUserMessage(newConsultationId, data.transcript_text);
      io.to(room).emit("message", userMessage);

      if (data.triage) {
        const { triageData, error } = await getTriageResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("errorMessage", "Error processing your request. Please try again."); return; }
        io.to(room).emit("response", await addSystemMessage(newConsultationId, triageData));
      } else {
        const { clinicalData, error } = await getClinicalSupportResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("errorMessage", "Error processing your request. Please try again."); return; }
        io.to(room).emit("response", await addClinicalSystemMessage(newConsultationId, clinicalData));
      }

      io.to(room).emit("recentMessages", await getLatestMessages(newConsultationId));
    });

    // CHW escalates a case to clinicians — broadcast to everyone in the room.
    socket.on("escalate", (data: { note?: string }) => {
      const session = sessions.get(socket.id);
      if (!session) { socket.emit("info", "Session not found. Please reconnect."); return; }
      io.to(roomName(session.consultationId)).emit("escalation", {
        consultationId: session.consultationId,
        by: { userId: user.id, name: displayName, role: user.role },
        note: data?.note ?? null,
        at: new Date().toISOString(),
      });
    });

    // Typing indicator — relay to the other participants only.
    socket.on("typing", (data: { isTyping: boolean }) => {
      const session = sessions.get(socket.id);
      if (!session) return;
      socket.to(roomName(session.consultationId)).emit("typing", {
        userId: user.id,
        name: displayName,
        isTyping: !!data?.isTyping,
      });
    });

    socket.on("disconnect", () => {
      sessions.delete(socket.id);
      const cid = removeParticipant(socket.id);
      if (cid) {
        socket.to(roomName(cid)).emit("participantLeft", { userId: user.id, name: displayName, role: user.role });
        broadcastPresence(cid);
      }
    });
  });
}

export { io };
