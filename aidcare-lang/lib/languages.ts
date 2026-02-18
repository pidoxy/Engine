// lib/languages.ts — Single source of truth for all language configuration
// UNDP Nigeria IC × Timbuktu Initiative — International Mother Language Day

import { LanguageCode } from '../types';

export interface Language {
  code: LanguageCode;
  name: string;           // English name
  nativeName: string;     // Name in the language itself
  nativeScript: string;   // Display label (includes Arabic script for Hausa)
  decorativeChar: string; // Large decorative character for card bg
  greeting: string;       // Opening assistant message in the language
  placeholder: string;    // Input placeholder in the language
  sendLabel: string;      // "Send" button label
  completeLabel: string;  // "Complete Assessment" button label
  thinkingLabel: string;  // Loading text ("Thinking...")
  speakingLabel: string;  // TTS playing indicator
  listeningLabel: string; // Recording indicator
  assessmentLabel: string;// "Assessment" label in results
  restartLabel: string;   // "Start New Assessment" button
  listenSummaryLabel: string; // "Listen to Summary" button
  symptomsBadgeLabel: string; // "Identified Symptoms" heading
  actionsLabel: string;   // "Recommended Actions" heading
  urgencyLabel: string;   // "Risk Level" heading
  whisperCode: string;    // BCP-47 code for Whisper language hint
  elevenLabsVoiceId: string; // ElevenLabs voice ID (fill after voice audit)
  accentColor: string;    // Primary accent hex color
  cardGradient: string;   // Tailwind gradient classes for language card
  speakCardLabel: string; // "Speak [Language]" text on card
}

export const LANGUAGES: Record<LanguageCode, Language> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    nativeScript: 'English',
    decorativeChar: 'E',
    greeting: "Hello! I'm here to help assess your symptoms. You can type or use the microphone. Please tell me — what are you experiencing?",
    placeholder: 'Describe your symptoms...',
    sendLabel: 'Send',
    completeLabel: 'Complete Assessment',
    thinkingLabel: 'Analysing your symptoms...',
    speakingLabel: 'Speaking...',
    listeningLabel: 'Recording',
    assessmentLabel: 'Health Assessment',
    restartLabel: 'Start New Assessment',
    listenSummaryLabel: 'Listen to Summary',
    symptomsBadgeLabel: 'Identified Symptoms',
    actionsLabel: 'Recommended Next Steps',
    urgencyLabel: 'Risk Level',
    whisperCode: 'en',
    elevenLabsVoiceId: process.env.NEXT_PUBLIC_VOICE_EN || 'EXAVITQu4vr4xnSDxMaL',
    accentColor: '#3b82f6',
    cardGradient: 'from-blue-900 via-blue-800 to-blue-700',
    speakCardLabel: 'Speak English',
  },

  ha: {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Hausa',
    nativeScript: 'هَوُسَ',
    decorativeChar: 'هـ',
    greeting: "Sannu! Ina nan don taimaka maka da lafiyarka. Zaka iya rubuta ko amfani da microphone. Ka faɗa mini — yaya kake ji?",
    placeholder: 'Faɗa alamun rashin lafiyar ka...',
    sendLabel: 'Aika',
    completeLabel: 'Kammala Gwajin',
    thinkingLabel: 'Ina nazarin alamunka...',
    speakingLabel: 'Ana magana...',
    listeningLabel: 'Ana yin rikodin',
    assessmentLabel: 'Gwajin Lafiya',
    restartLabel: 'Fara Gwajin Sabon',
    listenSummaryLabel: 'Saurara Taƙaitawa',
    symptomsBadgeLabel: 'Alamun da aka Gano',
    actionsLabel: 'Matakai da ake Shawarwari',
    urgencyLabel: 'Matsayin Haɗari',
    whisperCode: 'ha',
    elevenLabsVoiceId: process.env.NEXT_PUBLIC_VOICE_HA || 'TBvIh5TNCMX6pQNIcWV8',
    accentColor: '#10b981',
    cardGradient: 'from-emerald-900 via-emerald-800 to-green-700',
    speakCardLabel: 'Yi magana da Hausa',
  },

  yo: {
    code: 'yo',
    name: 'Yorùbá',
    nativeName: 'Yorùbá',
    nativeScript: 'Yorùbá',
    decorativeChar: 'Ẹ',
    greeting: "Ẹ káàárọ̀! Mo wà nibi lati ràn ọ́ lọ́wọ́ pẹ̀lú àwọn àmì àìsàn rẹ. O lè tẹ̀ àbọ̀ tàbí lo microphone. Jọ̀wọ́ sọ fún mi — bí o ṣe ń ní?",
    placeholder: 'Sọ àwọn àmì àìsàn rẹ...',
    sendLabel: 'Fi Ránṣẹ́',
    completeLabel: 'Parí Ìdánwò',
    thinkingLabel: 'Mo ń ṣe àyẹ̀wò àwọn àmì rẹ...',
    speakingLabel: 'Ń sọ̀rọ̀...',
    listeningLabel: 'Ń gbọ́',
    assessmentLabel: 'Ìdánwò Ìlera',
    restartLabel: 'Bẹ̀rẹ̀ Ìdánwò Tuntun',
    listenSummaryLabel: 'Gbọ Àkókò Àpẹẹrẹ',
    symptomsBadgeLabel: 'Àwọn Àmì tí A Rí',
    actionsLabel: 'Àwọn Ìgbésẹ̀ tí A Yàn',
    urgencyLabel: 'Ìpele Ewu',
    whisperCode: 'yo',
    elevenLabsVoiceId: process.env.NEXT_PUBLIC_VOICE_YO || '9Dbo4hEvXQ5l7MXGZFQA',
    accentColor: '#7c3aed',
    cardGradient: 'from-purple-900 via-violet-800 to-purple-700',
    speakCardLabel: 'Sọ ní Yorùbá',
  },

  ig: {
    code: 'ig',
    name: 'Igbo',
    nativeName: 'Igbo',
    nativeScript: 'Igbo',
    decorativeChar: 'Ọ',
    greeting: "Nnọọ! Anọ m ebe a iji nyere gị aka na ihe ọ bụ na-eme gị. I nwere ike ịdeere ma ọ bụ iji microphone. Biko gwa m — gị dị etu a?",
    placeholder: 'Kọọ ihe ọ bụ na-eme gị...',
    sendLabel: 'Ziga',
    completeLabel: 'Mechaa Nyocha',
    thinkingLabel: 'Ana m enyocha ihe ọ bụ na-eme gị...',
    speakingLabel: 'Na-asụ okwu...',
    listeningLabel: 'Na-edebanye ụda',
    assessmentLabel: 'Nyocha Ahụike',
    restartLabel: 'Malite Nyocha Ọhụrụ',
    listenSummaryLabel: 'Nụ Nchoputa',
    symptomsBadgeLabel: 'Ihe E Chọtara',
    actionsLabel: 'Nzọụkwụ A Tụrụ Aro',
    urgencyLabel: 'Ọkwa Ihe Ize Ndụ',
    whisperCode: 'ig',
    elevenLabsVoiceId: process.env.NEXT_PUBLIC_VOICE_IG || 'kMy0Co9mV2JmuSM9VcRQ',
    accentColor: '#dc2626',
    cardGradient: 'from-red-900 via-red-800 to-rose-700',
    speakCardLabel: 'Kwuo n\'Igbo',
  },

  pcm: {
    code: 'pcm',
    name: 'Naija Pidgin',
    nativeName: 'Naija Pidgin',
    nativeScript: 'Naija',
    decorativeChar: 'N',
    greeting: "How you dey! I dey here to help you check your body. You fit type or use microphone. Tell me — wetin dey do you?",
    placeholder: 'Tell me wetin dey do you...',
    sendLabel: 'Send Am',
    completeLabel: 'Complete Check',
    thinkingLabel: 'I dey check wetin you tell me...',
    speakingLabel: 'I dey talk...',
    listeningLabel: 'I dey hear you',
    assessmentLabel: 'Body Check',
    restartLabel: 'Start New Check',
    listenSummaryLabel: 'Hear the Summary',
    symptomsBadgeLabel: 'Things Wey I See',
    actionsLabel: 'Wetin You Need to Do',
    urgencyLabel: 'How Serious E Be',
    whisperCode: 'en', // Whisper fallback — no dedicated Pidgin model
    elevenLabsVoiceId: process.env.NEXT_PUBLIC_VOICE_PCM || '8P18CIVcRlwP98FOjZDm',
    accentColor: '#d97706',
    cardGradient: 'from-amber-900 via-yellow-800 to-amber-700',
    speakCardLabel: 'Yarn for Naija Pidgin',
  },
};

export const LANGUAGE_ORDER: LanguageCode[] = ['ha', 'yo', 'ig', 'pcm', 'en'];

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES[code] || LANGUAGES['en'];
}
