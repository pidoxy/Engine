import { Server, Socket } from "socket.io";
import {
  createConsultation, addUserMessage, addSystemMessage,
  addClinicalSystemMessage, getLatestMessages, getPatientForConsultation,
} from "@/service/consultation.service";
import { verifyToken } from "@/middleware/auth.middleware";
import { Server as HttpServer } from "http";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const ENGINE_URL = process.env.ENGINE_URL || "https://aidcare-triage-production.up.railway.app";

let io: Server;

interface Session {
  consultationId: string;
}

const sessions = new Map<string, Session>();

const getTriageResponse = async (
  message: string,
  manual_context: string,
  patientId: string
): Promise<{ triageData: any; error: boolean }> => {
  try {
    const response = await axios.post(
      `${ENGINE_URL}/triage/process_text/${patientId}`,
      { transcript_text: message, manual_context },
      { headers: { accept: "application/json", "Content-Type": "application/json" } }
    );
    return { triageData: response.data, error: false };
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
    const response = await axios.post(
      `${ENGINE_URL}/clinical_support/process_text/${patientId}`,
      { transcript_text: message, manual_context },
      { headers: { accept: "application/json", "Content-Type": "application/json" } }
    );
    return { clinicalData: response.data, error: false };
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

    if (consultationId && consultationId !== "undefined") {
      const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
      if (!consultation) { socket.emit("info", "Consultation not found."); socket.disconnect(); return; }
      if (consultation.consultantId !== userId) { socket.emit("info", "You don't have access to this consultation."); socket.disconnect(); return; }
    }

    if (patientId && patientId !== "undefined") {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) { socket.emit("info", "Patient not found."); socket.disconnect(); return; }
    }

    if (!consultationId || consultationId === "undefined") {
      // New consultation will be created on startConsultation event
    } else {
      sessions.set(socket.id, { consultationId });
      socket.emit("consultationId", consultationId);
      const patient = await getPatientForConsultation(consultationId);
      socket.emit("info", `Welcome back! Continuing consultation for ${patient?.firstName} ${patient?.lastName}.`);
      const messages = await getLatestMessages(consultationId);
      socket.emit("recentMessages", messages);
    }

    socket.on("message", async (data: { transcript_text: string; manual_context: string; triage: boolean }) => {
      const session = sessions.get(socket.id);
      if (!session) { socket.emit("info", "Session not found. Please reconnect."); return; }

      const userMessage = await addUserMessage(session.consultationId, data.transcript_text);
      socket.emit("message", userMessage);

      if (data.triage) {
        const { triageData, error } = await getTriageResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("info", "Error processing your request. Please try again."); return; }
        const systemResponse = await addSystemMessage(session.consultationId, triageData);
        socket.emit("response", systemResponse);
      } else {
        const { clinicalData, error } = await getClinicalSupportResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("info", "Error processing your request. Please try again."); return; }
        const systemResponse = await addClinicalSystemMessage(session.consultationId, clinicalData);
        socket.emit("response", systemResponse);
      }

      socket.emit("recentMessages", await getLatestMessages(session.consultationId));
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

      sessions.set(socket.id, { consultationId: newConsultationId });
      socket.emit("consultationId", newConsultationId);

      const userMessage = await addUserMessage(newConsultationId, data.transcript_text);
      socket.emit("message", userMessage);

      if (data.triage) {
        const { triageData, error } = await getTriageResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("info", "Error processing your request. Please try again."); return; }
        socket.emit("response", await addSystemMessage(newConsultationId, triageData));
      } else {
        const { clinicalData, error } = await getClinicalSupportResponse(data.transcript_text, data.manual_context, patientId);
        if (error) { socket.emit("info", "Error processing your request. Please try again."); return; }
        socket.emit("response", await addClinicalSystemMessage(newConsultationId, clinicalData));
      }

      socket.emit("recentMessages", await getLatestMessages(newConsultationId));
    });

    socket.on("disconnect", () => { sessions.delete(socket.id); });
  });
}

export { io };
