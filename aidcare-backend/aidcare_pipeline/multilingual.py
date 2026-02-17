# aidcare_pipeline/multilingual.py
# Handles multilingual Gemini conversations for the Naija language demo
# UNDP Nigeria IC × Timbuktu Initiative — International Mother Language Day

import google.generativeai as genai
import os
import time

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL_RECOMMEND", "gemini-2.0-flash-exp")

# ---------------------------------------------------------------------------
# Language system instructions — forces Gemini to respond in the target language
# ---------------------------------------------------------------------------

LANGUAGE_SYSTEM_INSTRUCTIONS = {
    'en': (
        "You are a compassionate medical triage assistant for Community Health Workers (CHWs) in Nigeria. "
        "Your role is to gather symptom information through a friendly, structured conversation. "
        "Ask ONE focused follow-up question at a time to understand the patient's condition. "
        "Respond in clear English. Never repeat questions already asked."
    ),
    'ha': (
        "Kai ne mataimakin lafiya mai tausayi don Masu Kula da Lafiya (CHW) a Najeriya. "
        "Aikinka shine tattara bayanan alamun rashin lafiya ta hanyar tattaunawa mai kyau. "
        "Ka tambayi TAMBAYA ƊAYA mai mahimmanci a lokaci guda don fahimtar halin mai haƙuri. "
        "Ka amsa DA HAUSA KAWAI a kowane hali. Kada ka amsa da Turanci ko wani harshe. "
        "[MUHIMMI: Ka amsa da Hausa kawai. Kar a taɓa canzawa zuwa Turanci.]"
    ),
    'yo': (
        "Ìwọ ni olùrànlọ́wọ́ ìlera tó ní ọkàn-àánú fún Àwọn Òṣìṣẹ́ Ìlera Àdúgbò (CHW) ní Nàìjíríà. "
        "Iṣẹ́ rẹ ni láti gba àlàyé nípa àwọn àmì àìsàn nípa ọ̀nà ìfọ̀rọ̀wérọ̀ tó dára. "
        "Béèrè ÌBÉÈRÈ KAN tó ṣe pàtàkì lóòkan láti lóye ipò alaisan. "
        "Fèsì NÍ YORÙBÁ NÌKAN lórí gbogbo àkókò. Má fèsì ní èdè Gẹ̀ẹ́sì tàbí èdè mìíràn. "
        "[PÀTÀKÌ: Fèsì ní Yorùbá nìkan. Má yí padà sí Gẹ̀ẹ́sì.]"
    ),
    'ig': (
        "Ị bụ onye enyemaka ahụike nwere obi ọma maka ndị Ọrụ Ahụike Obodo (CHW) na Naịjịrịa. "
        "Ọrụ gị bụ ịnakọta ozi gbasara ihe ọ bụ na-eme onye ọrịa site na mkparịta ụka dị mma. "
        "Jụọ AJỤJỤ OTU n'otu dị mkpa n'oge ọ bụla iji ghọta ọnọdụ onye ọrịa. "
        "Zaghachi N'IGBO NAANỊ n'oge ọ bụla. Ejikwala asusu Igbo na Bekee ma ọ bụ asụsụ ọzọ. "
        "[MKPA: Zaghachi n'Igbo naanị. Ghara ịgbanwe na Bekee.]"
    ),
    'pcm': (
        "You be kind health assistant for Community Health Workers (CHW) for Nigeria. "
        "Your job na to gather information about patient sickness through friendly conversation. "
        "Ask ONE important question one time to understand wetin dey do the patient. "
        "Respond IN NAIJA PIDGIN ONLY every time. No respond in English or any other language. "
        "[IMPORTANT: Respond in Naija Pidgin only. No switch to English.]"
    ),
}

# Language instructions injected into triage recommendation for translated output
LANGUAGE_TRIAGE_SYSTEM_INSTRUCTIONS = {
    'ha': (
        "Kai ne mataimakin kiwon lafiya na CHW na Najeriya. "
        "Rubuta DUKAN ƙimar JSON da Hausa. Ajiye maɓallan JSON a Turanci. "
        "Misali: 'summary_of_findings' maɓalli ya kasance a Turanci, amma ƙimar ta kasance Hausa. "
        "[MUHIMMI: Rubuta dukan ƙimar da Hausa kawai.]"
    ),
    'yo': (
        "Ìwọ ni olùrànlọ́wọ́ ìlera CHW ní Nàìjíríà. "
        "Kọ GBOGBO ìyebíye JSON ní Yorùbá. Ẹ jẹ́ kí àwọn bọ́tìnì JSON wà ní Gẹ̀ẹ́sì. "
        "Àpẹẹrẹ: bọ́tìnì 'summary_of_findings' wà ní Gẹ̀ẹ́sì, ṣùgbọ́n ìyebíye rẹ̀ wà ní Yorùbá. "
        "[PÀTÀKÌ: Kọ gbogbo ìyebíye ní Yorùbá nìkan.]"
    ),
    'ig': (
        "Ị bụ onye enyemaka ahụike CHW na Naịjịrịa. "
        "Dee ỤKPỤRỤ JSON niile n'Igbo. Hazie igodo JSON na Bekee. "
        "Ihe atụ: igodo 'summary_of_findings' nọ na Bekee, mana ụkpụrụ ya nọ n'Igbo. "
        "[MKPA: Dee ụkpụrụ niile n'Igbo naanị.]"
    ),
    'pcm': (
        "You be CHW health assistant for Nigeria. "
        "Write ALL JSON values in Naija Pidgin. Keep JSON keys in English. "
        "Example: key 'summary_of_findings' stay in English, but the value write am in Pidgin. "
        "[IMPORTANT: Write all values in Naija Pidgin only.]"
    ),
    'en': None,  # No override needed; existing English prompt is used as-is
}

# ---------------------------------------------------------------------------
# Urgent keywords across all 5 languages
# ---------------------------------------------------------------------------

URGENT_KEYWORDS = [
    # English
    "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
    "shortness of breath", "heart attack", "stroke", "seizure", "unconscious",
    "severe bleeding", "heavy bleeding", "anaphylaxis", "severe pain",
    # Hausa
    "ciwon zuciya", "zuciya tana ciwo", "ba zan iya numfashi ba",
    "matsalar numfashi", "farfadiya", "zubar jini mai yawa",
    # Yoruba
    "àyà ń fọ", "mí kò le jáde", "ìjàpọ̀ ọkàn", "ẹ̀jẹ̀ ń jade púpọ̀",
    "wọ́n kò mọ ara wọn", "kò lè mí",
    # Igbo
    "obi na-awa m", "m enweghị ike iku ume", "ọbara na-arị ọbara",
    "o dara n'ala", "ọ dara n'ihu",
    # Pidgin
    "chest dey pain", "i no fit breathe", "heart dey do me", "i dey bleed sotey",
    "e fall down", "e no dey conscious", "blood plenty dey commot",
]


def _language_name(code: str) -> str:
    names = {
        'en': 'English',
        'ha': 'Hausa',
        'yo': 'Yorùbá',
        'ig': 'Igbo',
        'pcm': 'Nigerian Pidgin'
    }
    return names.get(code, 'English')


def generate_multilingual_response(
    conversation_history: str,
    latest_message: str,
    language: str = 'en'
) -> dict:
    """
    Generate a conversational follow-up response in the specified Nigerian language.

    Args:
        conversation_history: Full conversation so far (PATIENT:/YOU: format)
        latest_message: The patient's most recent message
        language: Language code — 'en' | 'ha' | 'yo' | 'ig' | 'pcm'

    Returns:
        dict with keys: response, language, conversation_complete, should_auto_complete
    """
    if not GOOGLE_API_KEY:
        return {
            "response": "Service configuration error. Please try again.",
            "language": language,
            "conversation_complete": False,
            "should_auto_complete": False,
            "error": "Missing GOOGLE_API_KEY"
        }

    try:
        genai.configure(api_key=GOOGLE_API_KEY)
    except Exception as e:
        return {
            "response": "Service error. Please try again.",
            "language": language,
            "conversation_complete": False,
            "should_auto_complete": False,
            "error": str(e)
        }

    system_instruction = LANGUAGE_SYSTEM_INSTRUCTIONS.get(
        language, LANGUAGE_SYSTEM_INSTRUCTIONS['en']
    )

    # Count how many exchanges have happened
    exchange_count = conversation_history.count("PATIENT:") if conversation_history else 0

    # Check for urgency keywords across all languages
    full_text = (conversation_history + " " + latest_message).lower()
    is_urgent = any(kw.lower() in full_text for kw in URGENT_KEYWORDS)

    lang_name = _language_name(language)

    # Build the conversation prompt
    history_section = f"Conversation so far:\n{conversation_history}\n\n" if conversation_history.strip() else ""

    urgency_note = ""
    if is_urgent:
        urgency_note = f"\n\nUrgency detected. Advise the patient to seek immediate care. Keep response brief and in {lang_name}."

    auto_complete_note = ""
    if exchange_count >= 3:
        auto_complete_note = (
            f"\n\nYou have gathered enough information ({exchange_count} exchanges). "
            f"Tell the patient in {lang_name} that you have enough information to complete the assessment. "
            f"Add [COMPLETE_ASSESSMENT] at the very end of your response (hidden from patient)."
        )
    elif is_urgent and exchange_count >= 2:
        auto_complete_note = (
            f"\n\nUrgent situation detected after {exchange_count} exchanges. "
            f"Tell the patient you have enough information and will complete assessment now. "
            f"Add [COMPLETE_ASSESSMENT] at the very end (hidden from patient)."
        )

    prompt = (
        f"{history_section}"
        f"Patient's latest message:\n{latest_message}\n\n"
        f"Exchange count: {exchange_count}\n\n"
        f"Instructions:\n"
        f"- Respond ONLY in {lang_name}\n"
        f"- Ask ONE focused question about the most important missing symptom detail\n"
        f"- Never repeat a question already asked\n"
        f"- Be warm and concise"
        f"{urgency_note}"
        f"{auto_complete_note}"
    )

    max_retries = 2
    for attempt in range(max_retries):
        try:
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction=system_instruction
            )
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.75,
                    max_output_tokens=350,
                )
            )

            ai_response = ""
            if response.parts:
                ai_response = response.parts[0].text.strip()
            elif hasattr(response, 'text') and response.text:
                ai_response = response.text.strip()

            should_complete = "[COMPLETE_ASSESSMENT]" in ai_response
            # Clean the hidden marker from the response shown to patients
            ai_response = ai_response.replace("[COMPLETE_ASSESSMENT]", "").strip()

            # Force auto-complete after 5 exchanges regardless
            if exchange_count >= 5:
                should_complete = True

            return {
                "response": ai_response,
                "language": language,
                "conversation_complete": should_complete,
                "should_auto_complete": should_complete,
            }

        except Exception as e:
            print(f"Multilingual Gemini error (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 * (attempt + 1))
            else:
                # Fallback greeting in the target language
                fallbacks = {
                    'ha': "Ka ci gaba da faɗa mini alamun rashin lafiyar ka.",
                    'yo': "Jọ̀wọ́ tẹ̀síwájú sọ fún mi nípa àwọn àmì àìsàn rẹ.",
                    'ig': "Biko gwa m ọzọ maka ihe ọ bụ na-eme gị.",
                    'pcm': "Abeg tell me more about wetin dey do you.",
                    'en': "Please tell me more about your symptoms.",
                }
                return {
                    "response": fallbacks.get(language, fallbacks['en']),
                    "language": language,
                    "conversation_complete": False,
                    "should_auto_complete": False,
                    "error": str(e)
                }

    return {
        "response": "Please continue describing your symptoms.",
        "language": language,
        "conversation_complete": False,
        "should_auto_complete": False,
    }
