// ============================================================================
// IMPORTS & STYLING
// ============================================================================
import './style.css'

// ============================================================================
// CONFIGURATION & API CREDENTIALS
// ============================================================================

// Gemini API key
const GEMINI_API_KEY = ""; // <-- ADD YOUR GEMINI_API_KEY HERE

// ============================================================================
// GLOBAL STATE & CACHE MANAGEMENT
// ============================================================================

// External API endpoints
const TEAM_API_URL = 'https://api.fedkiit.com/api/user/fetchTeam';
const EVENTS_API_URL = 'https://api.fedkiit.com/api/form/getAllForms';

// Team members cache and timestamp for cache freshness check
let cachedTeamMembers = [];
let lastFetchTime = 0;

// Events cache and timestamp for cache freshness check
let cachedEvents = [];
let lastEventsFetchTime = 0;

// Cache duration: 5 minutes (prevents excessive API calls)
const CACHE_DURATION = 300000; // 300,000 milliseconds = 5 minutes

// ============================================================================
// DOM ELEMENTS REFERENCES
// ============================================================================

// Main chat container where messages are displayed
const chatContainer = document.getElementById('chat-container');

// Form element for submitting messages
const chatForm = document.getElementById('chat-form');

// Input field where users type messages
const userInput = document.getElementById('user-input');

// Send button to submit the chat form
const sendBtn = document.getElementById('send-btn');

// ============================================================================
// UTILITY FUNCTIONS - FETCH WITH RETRY LOGIC
// ============================================================================

/**
 * Fetches data from a URL with exponential backoff retry strategy.
 * If a request fails, it retries up to 3 times with increasing delays.
 * 
 * @param {string} url - The URL to fetch from
 * @returns {Promise<Response>} - The fetch response object if successful
 * @throws {Error} - Throws error if all retries fail
 */
async function fetchWithBackoff(url) {
    const maxRetries = 3;
    let response;
    let delay = 1000; // Start with 1 second delay

    for (let i = 0; i < maxRetries; i++) {
        try {
            response = await fetch(url);
            // If response is OK (status 200-299), return immediately
            if (response.ok) return response;
        } catch (e) {
            // Network error or fetch failure; wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Double the delay for next retry (exponential backoff)
            delay *= 2;
        }
        // If this is the last retry and we haven't returned, throw error
        if (i === maxRetries - 1) throw new Error("Failed to fetch data after multiple retries.");
    }
    
    // Safety check: if response exists but is not OK, throw error
    if (response && !response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    throw new Error("Unknown error during fetch operation.");
}

// ============================================================================
// TEAM DATA FETCHING & CACHING
// ============================================================================

/**
 * Fetches team members from the API and caches them locally.
 * Uses cache if fresh (less than 5 minutes old).
 * Filters out members with null names and sorts by year (descending) then name (alphabetically).
 * 
 * Process:
 * 1. Check if cache is fresh; if yes, skip fetching
 * 2. Fetch from API with retry logic
 * 3. Filter out null names
 * 4. Sort by year descending, then by name alphabetically
 * 5. Store in cache and update timestamp
 */
async function fetchAndCacheTeamData() {
    const now = Date.now();

    // Return early if cache is fresh and contains data
    if (now - lastFetchTime < CACHE_DURATION && cachedTeamMembers.length > 0) {
        console.log("Team data cache is fresh.");
        return;
    }

    console.log("Fetching fresh team data from API...");
    try {
        // Fetch team data with exponential backoff retry
        const response = await fetchWithBackoff(TEAM_API_URL);
        const data = await response.json();

        // Check if API returned success status
        if (data.success && data.data) {
            // Step 1: Filter out team members with null/undefined names
            const validMembers = data.data.filter(
                (member) => member.name !== null
            );

            // Step 2: Sort by year (newest first), then alphabetically by name
            const sortedMembers = validMembers.sort((a, b) => {
                // Primary sort: year in descending order (higher years first)
                if (b.year !== a.year) {
                    return b.year - a.year;
                }
                // Secondary sort: name in alphabetical order (A-Z)
                return a.name.localeCompare(b.name);
            });

            // Update cache and refresh timestamp
            cachedTeamMembers = sortedMembers;
            lastFetchTime = now;
            console.log(`Successfully fetched and cached ${cachedTeamMembers.length} team members.`);
        } else {
            console.error("API response success: false for team", data);
            cachedTeamMembers = [];
        }

    } catch (error) {
        console.error("Error fetching live team data:", error);
        // On error, keep using stale cache if available, or rely on empty array
    }
}

// ============================================================================
// EVENTS DATA FETCHING & CACHING
// ============================================================================

/**
 * Fetches events from the API and caches them locally.
 * Uses cache if fresh (less than 5 minutes old).
 * Separates upcoming events from past events (keeps 5 most recent past events).
 * 
 * Process:
 * 1. Check if cache is fresh; if yes, skip fetching
 * 2. Fetch from API with retry logic
 * 3. Filter upcoming events (isEventPast: false)
 * 4. Sort past events by date (newest first) and keep top 5
 * 5. Store both in cache
 */
async function fetchAndCacheEvents() {
    const now = Date.now();

    // Return early if cache is fresh and contains data
    if (now - lastEventsFetchTime < CACHE_DURATION && cachedEvents.length > 0) {
        console.log("Event data cache is fresh.");
        return;
    }

    console.log("Fetching fresh event data from API...");
    try {
        // Fetch events data with exponential backoff retry
        const response = await fetchWithBackoff(EVENTS_API_URL);
        const eventsData = await response.json();

        if (eventsData.success && eventsData) {
            // Step 1: Filter upcoming events (events that haven't passed yet)
            const upcomingEvents = eventsData.events.filter(event => !event.info.isEventPast);
            
            // Step 2: Sort all events by date (newest first)
            const rawPastEvents = [...eventsData.events].sort((a, b) => {
                const dateA = new Date(a.info.eventDate);
                const dateB = new Date(b.info.eventDate);
                return dateB.getTime() - dateA.getTime();
            });
            
            // Step 3: Extract just the 'info' property and keep only 5 most recent
            const pastEvents = rawPastEvents.map(event => event.info);
            
            // Step 4: Cache both upcoming and past events
            cachedEvents = { 
                upcomingEvents: upcomingEvents, 
                pastEvents: pastEvents.slice(0, 5) // Keep only 5 most recent
            };
            lastEventsFetchTime = now;
            
            const totalCached = upcomingEvents.length + pastEvents.length;
            console.log(`Successfully fetched and cached ${totalCached} events.`);
        } else {
            console.error("API response success: false", eventsData);
            cachedEvents = [];
        }

    } catch (error) {
        console.error("Error fetching live event data:", error);
        // On error, keep using stale cache if available
    }
}

// ============================================================================
// UI FUNCTIONS - MESSAGE DISPLAY
// ============================================================================

/**
 * Creates and appends a message bubble to the chat container.
 * Supports both user and bot messages with different styling.
 * Handles markdown-style formatting (bold text with **text**).
 * 
 * @param {string} role - Either 'user' or 'bot' to determine styling
 * @param {string} text - The message content to display
 */
function addMessage(role, text) {
    // Create outer container div for message alignment
    const div = document.createElement('div');
    div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} fade-in-up`;

    // Create message bubble with role-specific styling
    const bubble = document.createElement('div');
    bubble.className = `max-w-[85%] p-3 shadow-sm text-sm ${role === 'user'
        ? 'bg-gray-900 text-white rounded-2xl rounded-tr-none'     // User: dark bubble, right-aligned
        : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none'  // Bot: white bubble, left-aligned
        }`;

    // Convert markdown-style formatting to HTML
    // **text** becomes <strong>text</strong>
    // \n becomes <br> for line breaks
    bubble.innerHTML = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    // Add bubble to container and scroll to bottom
    div.appendChild(bubble);
    chatContainer.appendChild(div);
    scrollToBottom();
}

/**
 * Displays a loading indicator (animated dots) while waiting for AI response.
 * Creates a visual feedback that the bot is processing the query.
 */
function addLoadingIndicator() {
    const div = document.createElement('div');
    div.id = 'loading-indicator';
    div.className = 'flex justify-start fade-in-up';
    
    // Create three animated dots
    div.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
        </div>
    `;
    chatContainer.appendChild(div);
    scrollToBottom();
}

/**
 * Removes the loading indicator from the DOM when response is received.
 */
function removeLoadingIndicator() {
    const el = document.getElementById('loading-indicator');
    if (el) el.remove();
}

/**
 * Automatically scrolls the chat container to show the latest message.
 * Improves UX by keeping newest messages in view.
 */
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ============================================================================
// GEMINI API CONFIGURATION & SYSTEM PROMPT
// ============================================================================

/**
 * System prompt that defines FedRick's personality, capabilities, and constraints.
 * This prompt is sent to the Gemini API to guide the AI's responses.
 * 
 * Key sections:
 * - Identity and mission
 * - How to use injected team data
 * - How to use injected event data
 * - Strict guardrails for off-topic queries
 * - General knowledge about FED KIIT
 */
const SYSTEM_PROMPT = `
You are Fed Chatbot, the intelligent chatbot for FED Website.
FED means (Federation of Entrepreneurship Development) at KIIT University.

**YOUR MISSION:**
Answer user queries specifically related to the FED KIIT website, its team, events, and operations.

**LIVE TEAM DATA INJECTION:**
The user query will be prepended with the current list of FED Team Members in JSON format.
1. Use this injected team data for all questions about roles, current members, and team structure.
2. The key properties in the JSON are: 'name', 'access' (role code, e.g., PRESIDENT, DIRECTOR_TECHNICAL), 'year', and 'extra' (for designation, LinkedIn).
3. Translate the 'access' codes into friendly titles (e.g., DIRECTOR_TECHNICAL -> Director of Technical Team).

**LIVE EVENT DATA INJECTION:**
The user query may also be prepended with the current list of FED Events in JSON format.
1. Use this injected event data for all questions about upcoming events, past events, and event details.
2. The key properties in the JSON are: 'info' (with 'eventName', 'eventDate', 'isEventPast', etc.), and 'description'.
3. Use this data to provide accurate event information.
4. If the user asks about upcoming/live events (isEventPast: false), elaborate them more clearly.
5. If there is no upcoming/live event data, tell them about past events instead and also tell them to keep an eye on the website and social media for updates.  

**STRICT GUARDRAILS:**
1. **NO MATH:** If a user asks you to solve a math problem, politely refuse: "I am designed to help with FED KIIT related queries only. I cannot help with math assignments."
2. **NO IMAGE GENERATION:** Refuse: "I cannot generate images. I am a text-based assistant for FED."
3. **NO OFF-TOPIC:** Guide them back to FED: "I can only assist with information regarding the Federation of Entrepreneurship Development."
4. **TONE:** Professional, enthusiastic, entrepreneurial, and helpful. Use emojis occasionally (🚀, 💡).
5. **INTRO:** Don't introduce yourself again and again, only introduce yourself when user asks to do so.
6. **NO TABLE:** Don't present anything using tables, ALWAYS answer in list format.

**KNOWLEDGE BASE (General Info):**
* **About FED:** The Federation of Entrepreneurship Development (FED) is the official student body of KIIT TBI (Technology Business Incubator). We aim to nurture entrepreneurship through creative strategies, bringing potential startups under one umbrella.
* **Motto:** "Nurturing Using Innovative & Creative strategies."
* **Location:** Campus 11, KIIT Deemed to be University, Bhubaneswar, Odisha, 751024.
* **Contact:** fedkiit@gmail.com
* **Social Media:** Instagram (@fedkiit), LinkedIn, Twitter.
* **Registration/Joining:** Open to KIIT students. Visit the website to "Join Community."
`;

// ============================================================================
// GEMINI API INTEGRATION - RESPONSE GENERATION
// ============================================================================

/**
 * Generates a response from the Gemini AI model based on user query.
 * 
 * Process:
 * 1. Fetch fresh team and event data (or use cache)
 * 2. Prepare context by combining team and event data
 * 3. Send query + context + system prompt to Gemini API
 * 4. Return AI-generated response to user
 * 
 * @param {string} query - The user's question/message
 * @returns {Promise<string>} - The AI-generated response text
 */
async function generateResponse(query) {

    // Retrieve API key from configuration
    const key = GEMINI_API_KEY;

    // Validate API key presence
    if (key === undefined || key === "") {
        return "Firstly add GEMINI_API_KEY in src/main.js";
    }

    // Step 1: Ensure all data is fresh or cached for context
    await fetchAndCacheTeamData();
    await fetchAndCacheEvents();

    // Step 2: Prepare team context as JSON for the AI model
    const teamContext = "### LIVE TEAM DATA START ###\nTeam members list (JSON array, use this data source for current roles/names):\n" + JSON.stringify(cachedTeamMembers) + "\n### LIVE TEAM DATA END ###";
    
    // Step 3: Prepare events context (upcoming + past events as JSON)
    const eventContext = "### LIVE EVENT DATA START ###\nEvents list (JSON array, use this data source for current/upcoming events ):\n" + JSON.stringify(cachedEvents.upcomingEvents) + "\n### LIVE EVENT DATA END ###" + "\nif there is no upcoming event, mention past events. " + JSON.stringify(cachedEvents.pastEvents) + "\n### LIVE PAST EVENT DATA END ###"

    // Step 4: Combine all contexts with user query
    const finalPrompt = `${teamContext}\n${eventContext}\n\nUser Query: ${query}`;

    // Gemini API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`;

    let response;
    try {
        // Step 5: Prepare API request payload
        const apiPayload = {
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        };

        // Step 6: Send request with exponential backoff retry strategy
        const maxRetries = 3;
        let delay = 1000;

        for (let i = 0; i < maxRetries; i++) {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });
            
            // If successful, break out of retry loop
            if (response.ok) break;
            
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            
            // If last retry failed, throw error
            if (i === maxRetries - 1) throw new Error("Failed to get Gemini response after multiple retries.");
        }

        // Step 7: Verify response is OK
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        // Step 8: Extract text from API response
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Handle empty response
        if (!text) {
            return "Sorry, I received an empty response from the AI model. Please try a different query.";
        }

        return text;

    } catch (error) {
        // Log error for debugging
        console.error(error);
        
        // Provide specific error messages based on error type
        if (error.message.includes("400") || error.message.includes("403")) {
            return "Error: An API configuration issue occurred. Please verify your GEMINI_API_KEY in the script.";
        }
        
        return "Sorry, I'm having trouble connecting to the server right now. Please try again later.";
    }
}

// ============================================================================
// EVENT LISTENERS - CHAT FORM SUBMISSION
// ============================================================================

// Initial data fetch when app loads (populates cache immediately)
fetchAndCacheTeamData();
fetchAndCacheEvents();

/**
 * Handles chat form submission when user sends a message.
 * 
 * Process:
 * 1. Prevent default form submission
 * 2. Get and validate user input
 * 3. Display user message in chat
 * 4. Show loading indicator
 * 5. Get AI response
 * 6. Display bot response
 * 7. Reset input and button state
 */
chatForm.addEventListener('submit', async (e) => {
    // Prevent page reload on form submit
    e.preventDefault();
    
    // Get user input and trim whitespace
    const text = userInput.value.trim();
    
    // Ignore empty messages
    if (!text) return;

    // Display user's message in chat
    addMessage('user', text);
    
    // Clear input field for next message
    userInput.value = '';
    
    // Disable send button to prevent multiple submissions
    sendBtn.disabled = true;

    // Show typing indicator animation
    addLoadingIndicator();

    // Get AI response (waits for API call)
    const response = await generateResponse(text);

    // Remove typing indicator and display bot response
    removeLoadingIndicator();
    addMessage('bot', response);
    
    // Re-enable send button for next message
    sendBtn.disabled = false;
});