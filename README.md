# FED Chatbot

A sophisticated AI-powered chatbot for the Federation of Entrepreneurship Development (FED) at KIIT University. FedRick provides real-time information about FED team members, upcoming events, and organizational details using Google Gemini API with intelligent caching.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## ✨ Features

### Core Functionality
- **🤖 AI-Powered Responses** - Uses Google Gemini 2.5 Flash API with context injection
- **👥 Live Team Data** - Real-time team member information with intelligent caching (5-minute refresh)
- **📅 Event Management** - Displays upcoming events and 5 most recent past events
- **💬 Real-Time Chat** - Smooth, responsive chat interface with typing animations
- **🎨 Modern UI** - Glassmorphism design with Tailwind CSS styling
- **📱 Fully Responsive** - Mobile-first design works seamlessly on all devices

### Technical Features
- **⚡ Exponential Backoff Retry** - Automatic retry logic for failed API requests
- **💾 Smart Caching** - 5-minute cache duration prevents excessive API calls
- **🔐 API Key Obfuscation** - Base64 encoded Gemini API key for basic security
- **✅ Input Validation** - Prevents empty message submissions
- **🎭 Smooth Animations** - Fade-in effects and typing indicators for better UX
- **⚙️ Error Handling** - Graceful fallbacks with user-friendly error messages

## 🏗️ Architecture

### Data Flow
```
User Input → Chat Form
    ↓
generateResponse() function
    ↓
Fetch cached/fresh team & event data
    ↓
Inject data into prompt context
    ↓
Send to Gemini API with system instructions
    ↓
Display AI response in chat bubble
```

### API Integrations

#### 1. **FED Team Data API**
- **Endpoint:** `https://api.fedkiit.com/api/user/fetchTeam`
- **Data Structure:** Array of team members with `name`, `access` (role code), `year`, `extra` (designation/LinkedIn)
- **Processing:** Filters null names, sorts by year (descending) then name (alphabetical)
- **Cache:** 5 minutes

#### 2. **FED Events API**
- **Endpoint:** `https://api.fedkiit.com/api/form/getAllForms`
- **Data Structure:** Events with `info` object containing `eventName`, `eventDate`, `isEventPast`
- **Processing:** Separates upcoming events from past events, keeps 5 most recent past events
- **Cache:** 5 minutes

#### 3. **Google Gemini API**
- **Model:** `gemini-2.5-flash-preview-09-2025`
- **Method:** REST API with POST requests
- **Features:** System instructions + context injection + user query
- **Retry Logic:** 3 attempts with exponential backoff (1s, 2s, 4s delays)

## 🧠 AI System Design

### System Prompt Features
- **Personality:** FedRick - Professional, enthusiastic, entrepreneurial assistant
- **Mission:** Answer FED KIIT-specific queries only
- **Data Injection:** Live team and event data injected into every prompt
- **Guardrails:**
  - Refuses math homework help
  - Cannot generate images
  - Redirects off-topic queries back to FED
  - No table formatting (list format only)
  - Avoids redundant self-introductions

### Context Injection Strategy
- **Team Context:** Full JSON of current team members
- **Event Context:** Separate JSON arrays for upcoming and past events
- **Fallback:** If no upcoming events, mentions 5 most recent past events

## 📁 Project Structure

```
FED-Chatbot/
├── index.html              # HTML entry point with chat container
├── package.json            # Dependencies & scripts
├── postcss.config.js       # PostCSS configuration for Tailwind
├── tailwind.config.js      # Tailwind CSS customization
├── src/
│   ├── main.js            # Core application logic (400+ lines)
│   │   ├── API credentials
│   │   ├── Global state & caching
│   │   ├── Fetch with retry logic
│   │   ├── Team data fetching
│   │   ├── Event data fetching
│   │   ├── UI functions (messages, loading)
│   │   ├── Gemini API integration
│   │   └── Event listeners
│   └── style.css          # Tailwind CSS imports & animations
└── README.md              # This file
```

## 🔧 Tech Stack

- **Frontend Framework:** Vanilla JavaScript (no React despite README.md)
- **Styling:** Tailwind CSS + Custom CSS animations
- **Build Tool:** Vite
- **AI API:** Google Gemini 2.5 Flash
- **External APIs:** FED Team & Events APIs
- **Package Manager:** npm

## 🚦 Key Functions

### Data Management
| Function | Purpose | Cache Duration |
|----------|---------|-----------------|
| `fetchAndCacheTeamData()` | Fetches and caches team members | 5 minutes |
| `fetchAndCacheEvents()` | Fetches and caches events | 5 minutes |
| `fetchWithBackoff(url)` | Generic fetch with exponential retry | 3 attempts |

### UI Rendering
| Function | Purpose |
|----------|---------|
| `addMessage(role, text)` | Creates and displays chat message bubbles |
| `addLoadingIndicator()` | Shows animated typing dots |
| `removeLoadingIndicator()` | Removes loading animation |
| `scrollToBottom()` | Auto-scrolls chat to latest message |

### AI Integration
| Function | Purpose |
|----------|---------|
| `generateResponse(query)` | Fetches data, prepares context, calls Gemini API |

## ⚙️ Configuration

### Constants
```javascript
GEMINI_API_KEY          // Gemini API key
TEAM_API_URL            // FED team data endpoint
EVENTS_API_URL          // FED events data endpoint
CACHE_DURATION          // 300,000ms (5 minutes)
```

### System Prompt Configuration
The chatbot's behavior is entirely controlled by `SYSTEM_PROMPT` constant, which includes:
- Personality & tone guidelines
- Data injection instructions
- Guardrails for restricted content
- Knowledge base about FED KIIT

## 🔄 Message Flow

1. **User Input** → User types message and submits form
2. **Validation** → Empty messages are ignored
3. **Display** → User message appears in right-aligned dark bubble
4. **Fetch Data** → Fresh team/event data retrieved or cached version used
5. **Prepare Context** → Team and event data injected as JSON strings
6. **API Call** → Query + context + system prompt sent to Gemini
7. **Retry Logic** → If failed, retries up to 3 times with exponential backoff
8. **Parse Response** → Extract text from Gemini API response
9. **Format & Display** → Bot message in left-aligned white bubble with markdown rendering
10. **Cleanup** → Input cleared, button re-enabled for next message

## 🎨 UI Components

### Message Bubbles
- **User Messages:** Dark gray (`bg-gray-900`), right-aligned, white text
- **Bot Messages:** White with gray border, left-aligned, dark text
- **Loading State:** Three animated dots in gray

### Animations
- `fade-in-up` - Messages fade in and slide up on arrival
- `typing-dot` - Dots animate up/down while bot is typing

### Responsive Design
- Max message width: 85% of container
- Padding: 12px (3 units in Tailwind)
- Font size: Small (0.875rem)
- Rounded corners: 2xl with custom corner adjustments

## 🔐 Security Considerations

- **API Key:** Base64 encoded (basic obfuscation only, not cryptographically secure)
- **Prompt Injection:** System guardrails prevent jailbreaks
- **Input Sanitization:** HTML entities escaped via `innerHTML` (use caution with untrusted input)
- **CORS:** APIs must support cross-origin requests from frontend domain

## ⚠️ Error Handling

| Error Type | Behavior |
|------------|----------|
| Network Error | Retries 3 times with exponential backoff |
| API Timeout | Falls back to cached data if available |
| Invalid API Response | Returns user-friendly error message |
| Empty Gemini Response | Suggests trying a different query |
| 400/403 HTTP Errors | Advises checking API key configuration |

## 📊 Performance Optimizations

- **Caching:** 5-minute cache prevents redundant API calls
- **Exponential Backoff:** Reduces server load on failures
- **Lazy Loading:** Data fetched only when needed
- **Message Batching:** DOM operations bundled efficiently
- **CSS Animations:** GPU-accelerated transitions

## 🧪 Testing Queries

Try these queries to test FedRick:

```
"Who is the president of FED?"
"What are the upcoming events?"
"Tell me about FED KIIT"
"Who are the team members?"
"What is FED's mission?"
"How can I join FED?"
```

## 📱 Embedding in Other Projects

This chatbot can be embedded as:
- **iframe:** Load `index.html` as iframe source
- **Web Component:** Wrap in custom element
- **Submodule:** Include as git submodule in FED-Frontend

## 🐛 Known Limitations

- API key visible in client-side code (not suitable for production without backend)
- No user authentication or session management
- Team/event data limited by API response size
- No conversation history persistence
- Markdown rendering limited to bold and line breaks

## 🚀 Future Enhancements

- [ ] Conversation history with localStorage persistence
- [ ] User authentication & profile data
- [ ] Multi-language support
- [ ] Rich media support (images, links)
- [ ] Advanced markdown rendering (lists, tables, code blocks)
- [ ] Admin panel to manage system prompt
- [ ] Analytics dashboard for chatbot usage
- [ ] Voice input/output support

---
**Built with ❤️ by [MdMobid](https://github.com/MdMobid)**
