# AidCare Frontend - Simple Medical Triage UI

A clean, simple web interface for the AidCare medical triage system with Valyu integration.

## Features

- 🏥 **Clean Medical UI** - Professional, simple interface
- 📝 **Text-Based Triage** - Enter patient symptoms as text
- 🤖 **AI-Powered Analysis** - Gemini AI symptom extraction & recommendations
- 📚 **Valyu Research Integration** - Real-time medical literature and drug information
- 📊 **Knowledge Source Tracking** - See which databases were consulted
- ⚡ **Fast & Responsive** - Built with Next.js 15 and React 19

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Enter Symptoms**: Type patient symptoms in the text area
2. **Analyze**: Click "Analyze Symptoms" to process the triage
3. **Review Results**:
   - View urgency level and identified symptoms
   - Read the summary of findings
   - Follow recommended actions for CHWs
   - See knowledge sources consulted
   - Review Valyu research evidence (if enabled)
4. **New Assessment**: Click "New Assessment" to start over

## Configuration

### Backend API URL

The default backend URL is `http://localhost:8000`. To change it, update the `API_BASE_URL` constant in `app/page.tsx`:

```typescript
const API_BASE_URL = 'http://localhost:8000'; // Change this
```

### CORS Setup

Ensure your backend allows requests from `http://localhost:3000`. The backend should already have this configured in `main.py`.

## Project Structure

```
aidcare-pwa/
├── app/
│   ├── globals.css      # Global styles with medical theme
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main triage interface
├── public/              # Static assets
├── package.json         # Dependencies
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Triage Response Structure

The frontend expects this response format from the backend:

```typescript
{
  mode: string;
  extracted_symptoms: string[];
  knowledge_sources: {
    local_guidelines: number;
    pubmed_research: number;
    drug_databases: number;
    clinical_trials: number;
  };
  valyu_enrichment?: {
    enabled: boolean;
    research_articles?: Array<{
      title: string;
      source: string;
      key_finding: string;
      relevance_score: number;
      url: string;
    }>;
    drug_information?: Array<{
      drug: string;
      source: string;
      interaction_note: string;
    }>;
  };
  triage_recommendation: {
    summary_of_findings: string;
    recommended_actions_for_chw: string[];
    urgency_level: string;
    evidence_based_notes?: string;
  };
}
```

## Styling

The application uses:
- **Tailwind CSS** for utility-first styling
- **Custom CSS** for medical-themed components
- **Color Scheme**:
  - Primary Blue (#3b82f6) - Trust & professionalism
  - Success Green (#10b981) - Healthy status
  - Warning Orange (#f59e0b) - Caution
  - Error Red (#ef4444) - Urgent cases

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Backend Connection Failed

**Error**: "Failed to process triage. Please ensure the backend is running."

**Solution**:
1. Check that the backend is running: `cd aidcare-backend && uvicorn main:app --reload`
2. Verify the backend URL in `app/page.tsx`
3. Check CORS settings in `aidcare-backend/main.py`

### Build Errors

**Error**: TypeScript compilation errors

**Solution**: Run `npm install` to ensure all dependencies are installed

## Development

### Key Components

**Main Page (`app/page.tsx`)**:
- Triage form with text input
- Results display with urgency level
- Valyu research evidence cards
- Knowledge source statistics

**Styling (`app/globals.css`)**:
- Medical-themed color palette
- Reusable component classes
- Animations and transitions

## License

MIT

## Contributing

This is a simplified UI for demonstration purposes. For production use, consider adding:
- Audio recording functionality
- User authentication
- Patient data persistence
- Print/export functionality
- Mobile app version
- Offline support
