import { useState, useEffect, useRef } from 'react'
import upangLogo from './assets/upang logo.png'
import './App.css'

const quickPrompts = [
  "Where is the Registrar's Office?",
  'Where can I pay my tuition?',
  'How can I apply for a scholarship?',
  'Where are the campus buildings located?',
]

// Mock responses tailored to PHINMA University of Pangasinan
function generateCampusResponse(query) {
  const lower = query.toLowerCase()

  if (lower.includes('registrar') || lower.includes('tor') || lower.includes('transcript') || lower.includes('record')) {
    return {
      text: `The **Office of the University Registrar** is located on the **Ground Floor of the Main Building** (Administration Wing).\n\n• **Window Hours:** Monday to Friday, 8:00 AM – 5:00 PM | Saturday, 8:00 AM – 12:00 PM\n• **Services:** Transcript of Records (TOR), Honorable Dismissal, Certificate of Good Moral, True Copy of Grades (TCG), and CAV authentication.\n• **Document Processing:** You can submit document requests online via the Student Portal or visit Window 1 & 2 for document claiming.\n\n*Tip: Bring your Valid Student ID and official receipt when claiming documents.*`,
      followUps: ['How to request Honorable Dismissal?', 'What are the fees for Transcript of Records?'],
    }
  }

  if (lower.includes('tuition') || lower.includes('pay') || lower.includes('cashier') || lower.includes('fee') || lower.includes('installment')) {
    return {
      text: `PHINMA UPang offers flexible installment payment plans:\n\n**1. On-Campus Payment:**\n• **Location:** University Cashier, Ground Floor, Admin Wing\n• **Hours:** Mon–Fri 8:00 AM – 4:30 PM\n\n**2. Online / Bank Channels:**\n• **GCash / Maya:** Search for "PHINMA University of Pangasinan" in Bills Payment\n• **Landbank / BDO:** Over-the-counter or online bank deposit using your Student Number as Reference\n• **Student Portal:** Settle balances directly through the integrated payment gateway\n\n*Note: Allow 24 to 48 hours for online payments to reflect in your official ledger.*`,
      followUps: ['Where can I see my remaining balance?', 'Promissory note procedures'],
    }
  }

  if (lower.includes('scholarship') || lower.includes('hawak kamay') || lower.includes('discount') || lower.includes('grant')) {
    return {
      text: `PHINMA UPang is committed to accessible education through the **Hawak Kamay (HK) Scholarship**:\n\n• **Coverage:** Up to 50% – 75% tuition and miscellaneous discount.\n• **Eligibility:** Open to high school graduates and continuing students with a heart to learn. No maintaining honors grade required — just pass your enrolled subjects!\n• **Requirements:**\n  1. Accomplished HK Application Form\n  2. Certificate of Indigency or Proof of Income (ITR)\n  3. Latest Report Card or Transcript of Grades\n  4. 2x2 ID Photo\n• **Where to apply:** Student Development & Scholarships Office, 2nd Floor Student Pavilion.`,
      followUps: ['Are there scholarships for Dean\'s Listers?', 'CHED Tulong Dunong requirements'],
    }
  }

  if (lower.includes('building') || lower.includes('cea') || lower.includes('cbt') || lower.includes('library') || lower.includes('map') || lower.includes('where')) {
    return {
      text: `Here is a quick directory of key campus landmarks at PHINMA UPang Dagupan:\n\n• 🏛️ **Main Building:** Administration, Registrar, Cashier, and College of Education.\n• 🏗️ **CEA Building:** College of Engineering & Architecture, drafting laboratories, CAD labs, and civil testing rooms.\n• 💼 **CBT Building:** College of Business and Technology, IT/Computer laboratories, and business mock offices.\n• 📖 **University Library:** 3rd & 4th Floors of the Student Center Building with quiet study carrels, online catalog access, and discussion rooms.\n• 🏀 **University Gymnasium:** Located near the athletic field for physical education classes and university assemblies.`,
      followUps: ['Where is the IT laboratory located?', 'Where is the Student Pavilion?'],
    }
  }

  if (lower.includes('enroll') || lower.includes('subject') || lower.includes('advising') || lower.includes('schedule')) {
    return {
      text: `Step-by-Step Enrollment Guide for PHINMA UPang Wildcats:\n\n1. **Step 1 — Advising:** Log in to the UPang Student Portal or visit your College Dean's Office for curriculum evaluation.\n2. **Step 2 — Sectioning:** Select your course load and class schedules.\n3. **Step 3 — Assessment:** Review your breakdown of tuition and payment schedule.\n4. **Step 4 — Downpayment:** Settle the minimum downpayment through online channels or the Cashier.\n5. **Step 5 — Official Registration:** Your Certificate of Matriculation (COM) will be generated and marked ENROLLED.`,
      followUps: ['Can I add or drop subjects after enrollment?', 'How to shift programs?'],
    }
  }

  if (lower.includes('clinic') || lower.includes('guidance') || lower.includes('counseling') || lower.includes('health') || lower.includes('doctor')) {
    return {
      text: `Student Health & Wellness Facilities:\n\n• 🩺 **University Clinic:** Ground Floor, Student Pavilion.\n  - Open Monday to Friday, 8:00 AM – 5:00 PM.\n  - Offers free physician consultations, routine checkups, emergency first aid, and basic over-the-counter medicine.\n\n• 💬 **Guidance & Counseling Center:** 2nd Floor, Main Wing.\n  - Provides academic counseling, career assessments, and psychological wellness counseling.\n  - Consultations are strictly confidential. Walk-ins and appointments are welcome.`,
      followUps: ['Medical certificate requirement for absences', 'How to schedule a guidance appointment'],
    }
  }

  return {
    text: `Hello, Wildcat! I am here to assist you with anything regarding **PHINMA University of Pangasinan**.\n\nYou can ask me about:\n• 🏛️ Registrar window hours, TOR requests, and certifications\n• 💳 Tuition payments, installment plans, and cashier lines\n• 🎓 Hawak Kamay scholarships, grants, and discounts\n• 🗺️ Campus buildings, IT labs, and library facilities\n• 📋 Enrollment procedures and curriculum advising\n\nHow can I best help you today?`,
    followUps: ['Where is the Registrar\'s Office?', 'How to apply for Hawak Kamay scholarship?'],
  }
}

let nextUniqueId = 1000
function getNextId(prefix = 'item') {
  nextUniqueId += 1
  return `${prefix}_${nextUniqueId}`
}

export default function App() {
  const [view, setView] = useState('assistant')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [historyList, setHistoryList] = useState([
    { id: 'h1', title: "Where is the Registrar's Office?" },
    { id: 'h2', title: 'Hawak Kamay scholarship requirements' },
    { id: 'h3', title: 'Tuition payment channels' },
  ])

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSendMessage = (textToSend) => {
    const trimmed = (textToSend || input).trim()
    if (!trimmed || isTyping) return

    const userMessage = {
      id: getNextId('user_msg'),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Save to history if this is a fresh conversation
    if (messages.length === 0) {
      const newHistoryItem = {
        id: getNextId('hist'),
        title: trimmed.length > 32 ? trimmed.substring(0, 32) + '...' : trimmed,
      }
      setHistoryList((prev) => [newHistoryItem, ...prev])
      setActiveHistoryId(newHistoryItem.id)
    }

    // Simulate AI response delay
    setTimeout(() => {
      const responseData = generateCampusResponse(trimmed)
      const assistantMessage = {
        id: getNextId('asst_msg'),
        sender: 'assistant',
        text: responseData.text,
        followUps: responseData.followUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 450)
  }

  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt)
  }

  const handleNewConversation = () => {
    setMessages([])
    setInput('')
    setActiveHistoryId(null)
    if (window.innerWidth <= 900) {
      setSidebarOpen(false)
    }
  }

  const handleSelectHistory = (item) => {
    setActiveHistoryId(item.id)
    const responseData = generateCampusResponse(item.title)
    setMessages([
      {
        id: getNextId('hist_usr'),
        sender: 'user',
        text: item.title,
        timestamp: 'Just now',
      },
      {
        id: getNextId('hist_asst'),
        sender: 'assistant',
        text: responseData.text,
        followUps: responseData.followUps,
        timestamp: 'Just now',
      },
    ])
    if (window.innerWidth <= 900) {
      setSidebarOpen(false)
    }
  }

  const handleDeleteHistory = (e, id) => {
    e.stopPropagation()
    setHistoryList((prev) => prev.filter((item) => item.id !== id))
    if (activeHistoryId === id) {
      handleNewConversation()
    }
  }

  if (view === 'login') {
    return <LoginPage onGuest={() => setView('assistant')} onSignUp={() => setView('signup')} />
  }

  if (view === 'signup') {
    return <SignupPage onBack={() => setView('login')} />
  }

  return (
    <div className="app-shell">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="brand" aria-label="Upang Assist brand">
          <div className="brand-badge">
            <img src={upangLogo} alt="PHINMA UPang Logo" className="brand-logo-img" />
          </div>
          <h1>Upang Assist</h1>
          <button
            className="sidebar-close-btn"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Conversation Button */}
        <button
          className="new-conversation"
          type="button"
          onClick={handleNewConversation}
        >
          <span className="plus">+</span>
          <span>New Conversation</span>
        </button>

        {/* History Section */}
        <div className="history-label">History</div>
        <ul className="history-list">
          {historyList.map((item) => (
            <li
              key={item.id}
              className={`history-item ${activeHistoryId === item.id ? 'active' : ''}`}
              onClick={() => handleSelectHistory(item)}
            >
              <span className="history-title">{item.title}</span>
              <button
                type="button"
                className="history-delete-btn"
                onClick={(e) => handleDeleteHistory(e, item.id)}
                title="Delete conversation"
                aria-label="Delete item"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* Sidebar Links & Log In */}
        <div className="sidebar-links">
          <span>Help</span>
          <span>Settings</span>
        </div>

        <button
          className="login-btn"
          type="button"
          onClick={() => setView('login')}
        >
          LOG IN
        </button>
      </aside>

      {/* Main Panel */}
      <main className="main-panel">
        {/* Top Header Bar */}
        <header className="main-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-trigger"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="campus-badge">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Si Apple to</span>
            </div>
          </div>

          <div className="topbar-right">
            {messages.length > 0 && (
              <button
                className="reset-chat-btn"
                type="button"
                onClick={handleNewConversation}
                title="Start a new conversation"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M8 16H3v5"></path>
                </svg>
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area: Welcome Center Screen OR Chat Thread */}
        <div className="main-content-scroll">
          {messages.length === 0 ? (
            <div className="welcome-center">
              <div className="hero-emblem-badge">
                <img src={upangLogo} alt="UPang Torch" className="hero-torch-img" />
              </div>

              <header className="welcome-block">
                <h2>
                  Welcome to <span>Upang Assist</span>
                </h2>
                <p className="welcome-tagline">What can I help you today?</p>
              </header>

              <form
                className="prompt-box"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              >
                <span className="prompt-plus" aria-hidden="true">+</span>
                <input
                  ref={inputRef}
                  className="prompt-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Anything"
                  aria-label="Ask a question"
                />
                {input && (
                  <button
                    type="button"
                    className="prompt-clear-btn"
                    onClick={() => setInput('')}
                    aria-label="Clear input text"
                  >
                    ✕
                  </button>
                )}
                <button
                  className={`send-btn ${input.trim() ? 'send-btn-active' : ''}`}
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || isTyping}
                >
                  <span className="send-arrow" aria-hidden="true">→</span>
                </button>
              </form>

              <div className="suggestion-list">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-row ${msg.sender === 'user' ? 'message-user' : 'message-assistant'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="message-avatar" aria-hidden="true">
                      <img src={upangLogo} alt="UPang Assistant" className="avatar-torch" />
                    </div>
                  )}

                  <div className="message-bubble-wrap">
                    <div className="message-meta">
                      <span className="sender-name">
                        {msg.sender === 'user' ? 'You' : 'Upang Assistant'}
                      </span>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>

                    <div className="message-bubble">
                      {msg.sender === 'assistant' ? (
                        <div
                          className="formatted-content"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(msg.text),
                          }}
                        />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>

                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="followup-chips">
                        {msg.followUps.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className="followup-chip-btn"
                            onClick={() => handleSendMessage(chip)}
                          >
                            <span>{chip}</span>
                            <span className="chip-plus">+</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="user-avatar-bubble" aria-hidden="true">
                      <span>U</span>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="message-row message-assistant">
                  <div className="message-avatar" aria-hidden="true">
                    <img src={upangLogo} alt="UPang Assistant" className="avatar-torch" />
                  </div>
                  <div className="message-bubble-wrap">
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Docked Prompt Box for ongoing chat */}
        {messages.length > 0 && (
          <div className="chat-composer-wrap">
            <form
              className="prompt-box prompt-box-docked"
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
            >
              <span className="prompt-plus" aria-hidden="true">+</span>
              <input
                ref={inputRef}
                className="prompt-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Anything"
                aria-label="Ask a question"
              />
              {input && (
                <button
                  type="button"
                  className="prompt-clear-btn"
                  onClick={() => setInput('')}
                  aria-label="Clear input text"
                >
                  ✕
                </button>
              )}
              <button
                className={`send-btn ${input.trim() ? 'send-btn-active' : ''}`}
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || isTyping}
              >
                <span className="send-arrow" aria-hidden="true">→</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

// Markdown formatter for clean assistant text display
function formatMarkdown(text) {
  if (!text) return ''

  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')

  const lines = formatted.split('\n')
  let inList = false
  let result = []

  for (let line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul class="chat-md-list">')
        inList = true
      }
      result.push(`<li>${trimmed.substring(2)}</li>`)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      if (trimmed === '') {
        result.push('<div class="chat-md-gap"></div>')
      } else {
        result.push(`<p class="chat-md-p">${line}</p>`)
      }
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('')
}

function LoginPage({ onGuest, onSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="University campus">
        <div className="login-visual-overlay"></div>
        <div className="login-visual-copy">
          <div className="visual-emblem-badge">
            <img src={upangLogo} alt="PHINMA UPang Logo" className="visual-logo-img" />
          </div>
          <span>PHINMA</span>
          <strong>University of Pangasinan</strong>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-content">
          <p className="login-kicker">WELCOME!</p>
          <h1>To <span>Upang Assist</span></h1>
          <h2>Log In</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="email"
                type="email"
                placeholder="student@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="password-label-row">
              <label htmlFor="password">Password:</label>
              <button type="button" className="forgot-link">Forgot password?</button>
            </div>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <button className="login-submit" type="submit">Log In</button>
          </form>

          <div className="login-divider"><span>Or Continue With:</span></div>

          <div className="social-login">
            <button type="button" onClick={() => alert('Google login')}><strong>G</strong> Google</button>
            <button type="button" onClick={onGuest}>Guest</button>
          </div>

          <p className="login-footer">
            Don't have an account? <button type="button" onClick={onSignUp}>Sign Up</button>
          </p>
          {submitted && <p className="login-status" role="status">Login details ready to submit.</p>}
        </div>
      </section>
    </main>
  )
}

function SignupPage({ onBack }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="login-page signup-page">
      <section className="login-visual" aria-label="University campus">
        <div className="login-visual-overlay"></div>
        <div className="login-visual-copy">
          <div className="visual-emblem-badge">
            <img src={upangLogo} alt="PHINMA UPang Logo" className="visual-logo-img" />
          </div>
          <span>PHINMA</span>
          <strong>University of Pangasinan</strong>
        </div>
      </section>

      <section className="login-panel">
        <button className="login-back-btn" type="button" onClick={onBack} aria-label="Back to login">
          <span className="back-arrow">←</span>
          <span>Back to Login</span>
        </button>

        <div className="login-content signup-content">
          <h2>Sign Up</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="full-name">Full Name:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="full-name"
                name="fullName"
                type="text"
                placeholder="e.g. Juan Dela Cruz"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <label htmlFor="signup-email">Email Address:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="student@gmail.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <label htmlFor="signup-password">Password:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <label htmlFor="confirm-password">Confirm Password:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <button className="login-submit signup-submit" type="submit">SIGN IN</button>
          </form>

          <div className="terms-row">
            <label>
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
              Terms and Conditions
            </label>
            <label>
              <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} />
              Privacy Policy
            </label>
          </div>

          <p className="agreement-copy">
            By signing in you agree to our <strong>Terms and Privacy Policy</strong>
          </p>
          {submitted && <p className="login-status" role="status">Sign-up details ready to submit.</p>}
        </div>
      </section>
    </main>
  )
}
