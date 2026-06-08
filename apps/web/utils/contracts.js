export function getEntityId(record) {
  return record?.id ?? record?._id ?? null;
}

export function normalizeChatSender(sender) {
  if (!sender) return null;

  if (sender === 'USER' || sender === 'user') return 'user';
  if (sender === 'SYSTEM' || sender === 'system') return 'system';

  return String(sender).toLowerCase();
}

export function normalizeChatMessage(message) {
  if (!message) return null;

  const id = getEntityId(message);
  const sender = normalizeChatSender(message.sender);
  const createdAt = message.createdAt ?? message.timeSent ?? null;
  const userMessage = message.userMessage ?? message.content ?? '';

  return {
    ...message,
    id,
    _id: id,
    sender,
    createdAt,
    timeSent: createdAt,
    userMessage,
    content: userMessage,
  };
}

export function normalizeConsultation(consultation) {
  if (!consultation) return null;

  const id = getEntityId(consultation);
  const messages = (consultation.messages ?? consultation.chats ?? [])
    .map(normalizeChatMessage)
    .filter(Boolean);
  const firstUserMessage =
    messages.find((message) => message.sender === 'user')?.userMessage ??
    consultation.firstMessage ??
    consultation.title ??
    'No messages';

  return {
    ...consultation,
    id,
    _id: id,
    messages,
    chats: messages,
    firstMessage: firstUserMessage,
  };
}

export function normalizePatient(patient) {
  if (!patient) return null;

  const id = getEntityId(patient);
  const consultations = (patient.consultations ?? [])
    .map(normalizeConsultation)
    .filter(Boolean);

  return {
    ...patient,
    id,
    _id: id,
    organizationId: patient.organizationId ?? patient.organization ?? null,
    fullName:
      patient.fullName ??
      [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim(),
    consultations,
  };
}

export function normalizePatients(patients = []) {
  return patients.map(normalizePatient).filter(Boolean);
}
