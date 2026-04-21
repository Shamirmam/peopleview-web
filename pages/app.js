import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const SEED_AGENTS = [
  {
    id: 'seed1', name: 'Shamir M.', age: 28, city: 'Paris',
    passion: 'Sciences, Business, Tech, Mode, Entrepreneuriat',
    decision: 8, risk: 5, comm: ['Diplomate', 'Analytique'],
    vision: "Il faut toujours donner le meilleur de soi-même — pas pour les autres, mais parce que c'est la seule façon de vivre une vie dont on est fier.",
    color: { bg: 'rgba(45,206,137,.12)', text: '#1a8a5a' },
  },
  {
    id: 'seed2', name: 'Camille R.', age: 29, city: 'Paris', passion: 'Design UX',
    decision: 5, risk: 4, comm: ['Empathique', 'Diplomatique'],
    vision: "Les meilleures décisions se prennent quand on comprend vraiment les gens qui les vivent.",
    color: { bg: 'rgba(77,166,255,.12)', text: '#1a5fa0' },
  },
  {
    id: 'seed3', name: 'Alex M.', age: 41, city: 'Bordeaux', passion: 'Finance & investissement',
    decision: 9, risk: 6, comm: ['Analytique', 'Direct'],
    vision: "Les données ne mentent pas. Tout le reste, c'est du bruit.",
    color: { bg: 'rgba(200,150,20,.12)', text: '#8a6400' },
  },
  {
    id: 'seed4', name: 'Inès B.', age: 26, city: 'Marseille', passion: 'Créativité & art',
    decision: 3, risk: 7, comm: ['Sarcastique', 'Direct'],
    vision: "Le monde récompense les originaux. Copier c'est choisir la médiocrité.",
    color: { bg: 'rgba(200,60,160,.12)', text: '#9a1a7a' },
  },
  {
    id: 'seed5', name: 'Karim T.', age: 38, city: 'Nantes', passion: 'Tech & IA',
    decision: 7, risk: 8, comm: ['Analytique', 'Provocateur'],
    vision: "On surestime ce que l'IA fera en 1 an et on sous-estime ce qu'elle fera en 10 ans.",
    color: { bg: 'rgba(120,60,220,.12)', text: '#5a20b0' },
  },
]

const CHIPS = ['Direct', 'Diplomate', 'Provocateur', 'Empathique', 'Analytique', 'Sarcastique']

const TOPIC_EXAMPLES = [
  ['Faut-il quitter son CDI pour lancer sa startup ?', 'Quitter son CDI'],
  ["L'IA va-t-elle remplacer les créatifs ?", 'IA et créativité'],
  ['Vaut-il mieux être riche ou libre ?', 'Riche ou libre'],
  ['Faut-il vivre à Paris ou quitter la capitale ?', 'Paris ou province'],
  ['Les réseaux sociaux font-ils plus de mal que de bien ?', 'Réseaux sociaux'],
  ['Vaut-il mieux acheter ou louer sa résidence principale ?', 'Acheter vs louer'],
]

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function buildSystem(agent) {
  const dLabel = agent.decision <= 3 ? 'très intuitif' : agent.decision <= 6 ? 'mi-intuitif mi-analytique' : 'très analytique'
  const rLabel = agent.risk <= 3 ? 'très prudent et conservateur' : agent.risk <= 6 ? 'modéré dans ta prise de risque' : 'audacieux, tu aimes les paris'
  return `Tu es ${agent.name}, ${agent.age} ans, basé(e) à ${agent.city}.
Passion/expertise : ${agent.passion}.
Style de décision : ${dLabel}.
Rapport au risque : ${rLabel}.
Style de communication : ${agent.comm.join(', ')}.
Vision du monde : "${agent.vision}"
Débats en restant dans ce personnage. 3-4 phrases max par tour. Sois direct, opinionné, authentique. Pas de formules d'introduction génériques comme "Bien sûr" ou "C'est une bonne question".`
}

async function callDebate(system, messages) {
  const res = await fetch('/api/debate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

export default function App() {
  const [screen, setScreen] = useState('create')

  const [formName, setFormName] = useState('')
  const [formAge, setFormAge] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formPassion, setFormPassion] = useState('')
  const [formDecision, setFormDecision] = useState(5)
  const [formRisk, setFormRisk] = useState(5)
  const [formVision, setFormVision] = useState('')
  const [selectedChips, setSelectedChips] = useState([])

  const [myAgent, setMyAgent] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [topicValue, setTopicValue] = useState('')
  const [currentTopic, setCurrentTopic] = useState('')

  const [createErr, setCreateErr] = useState('')
  const [topicErr, setTopicErr] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('')
  const [turnTrack, setTurnTrack] = useState(Array(6).fill('idle'))
  const [turns, setTurns] = useState([])
  const [synthesis, setSynthesis] = useState('')

  function goTo(id) {
    setScreen(id)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  function toggleChip(chip) {
    setSelectedChips(prev => {
      if (prev.includes(chip)) return prev.filter(c => c !== chip)
      if (prev.length >= 2) return prev
      return [...prev, chip]
    })
  }

  function submitMyAgent() {
    if (!formName || !formAge || !formCity || !formPassion || !formVision || selectedChips.length === 0) {
      setCreateErr('Remplis tous les champs et sélectionne au moins un style de communication.')
      return
    }
    setCreateErr('')
    setMyAgent({
      id: 'me', name: formName, age: parseInt(formAge),
      city: formCity, passion: formPassion,
      decision: formDecision, risk: formRisk,
      comm: selectedChips, vision: formVision,
      color: { bg: 'rgba(255,77,28,.12)', text: '#cc3300' },
    })
    goTo('pick')
  }

  async function launchDebate() {
    if (!topicValue.trim()) { setTopicErr('Saisis un sujet de débat.'); return }
    setTopicErr('')
    const topic = topicValue.trim()
    setCurrentTopic(topic)
    setTurnTrack(Array(6).fill('idle'))
    setTurns([])
    setSynthesis('')
    goTo('loading')

    const a1 = myAgent, a2 = selectedAgent
    const newTurns = []
    const loadMsgs = [
      `${a1.name} prend position…`, `${a2.name} réplique…`,
      `${a1.name} contre-attaque…`, `${a2.name} insiste…`,
      `${a1.name} conclut…`, `${a2.name} a le dernier mot…`,
    ]

    try {
      for (let i = 0; i < 6; i++) {
        setTurnTrack(prev => prev.map((v, idx) => idx === i ? 'active' : v))
        setLoadingMsg(loadMsgs[i])
        const isMe = i % 2 === 0
        const system = isMe ? buildSystem(a1) : buildSystem(a2)
        const speaker = isMe ? a1 : a2
        const other = isMe ? a2 : a1
        const userMsg = i === 0
          ? `Sujet : "${topic}". Donne ta position en 3-4 phrases.`
          : `${other.name} vient de dire : "${newTurns[newTurns.length - 1].text}"\nRéponds-lui directement en restant dans ton personnage.`
        const reply = await callDebate(system, [{ role: 'user', content: userMsg }])
        newTurns.push({ speaker: speaker.name, text: reply, isMe })
        setTurnTrack(prev => prev.map((v, idx) => idx === i ? 'done' : v))
      }
      setLoadingMsg('Synthèse en cours…')
      const transcript = newTurns.map(t => `${t.speaker}: ${t.text}`).join('\n\n')
      const synthText = await callDebate(
        'Tu es un modérateur de débat neutre et concis. Réponds en français.',
        [{ role: 'user', content: `Débat entre ${a1.name} et ${a2.name} sur : "${topic}"\n\n${transcript}\n\nSynthèse neutre en 3 phrases : position de chacun, point de convergence s'il y en a, désaccord principal.` }]
      )
      setTurns(newTurns)
      setSynthesis(synthText)
      goTo('result')
    } catch (e) {
      goTo('topic')
      setTopicErr(`Erreur API : ${e.message}`)
    }
  }

  function fullRestart() {
    setMyAgent(null); setSelectedAgent(null); setSelectedChips([])
    setTurns([]); setSynthesis(''); setCurrentTopic(''); setTopicValue('')
    setFormName(''); setFormAge(''); setFormCity(''); setFormPassion('')
    setFormDecision(5); setFormRisk(5); setFormVision('')
    goTo('create')
  }

  const stepLabel = screen === 'create' ? '1 / 2 — Crée ton agent'
    : screen === 'pick' ? '2 / 2 — Choisis ton adversaire'
    : null

  return (
    <>
      <Head>
        <title>PeopleView — Créer mon agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">

        {/* NAV */}
        <header className="nav">
          <div className="nav-in">
            <Link href="/" className="logo">
              <div className="logo-dot" />
              PEOPLEVIEW
            </Link>
            {stepLabel && (
              <div className="nav-step">{stepLabel}</div>
            )}
          </div>
        </header>

        <div className="content">

          {/* ── CREATE AGENT ─────────────────────── */}
          {screen === 'create' && (
            <div className="screen fade-in">
              <div className="screen-head">
                <div className="eyebrow">Étape 1 sur 2</div>
                <h1 className="screen-title">Crée ton agent</h1>
                <p className="screen-sub">Sois honnête — c&apos;est ça qui rend le débat authentique.</p>
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="label">Prénom</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Sophie" />
                </div>
                <div className="field">
                  <label className="label">Âge</label>
                  <input type="number" value={formAge} onChange={e => setFormAge(e.target.value)} placeholder="28" />
                </div>
              </div>

              <div className="field">
                <label className="label">Ville</label>
                <input value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="Paris" />
              </div>

              <div className="field">
                <label className="label">Passion / expertise principale</label>
                <input value={formPassion} onChange={e => setFormPassion(e.target.value)} placeholder="Design, Investissement, Cuisine…" />
              </div>

              <div className="slider-block">
                <label className="label">Prise de décision</label>
                <div className="slider-row">
                  <span className="slider-end">Instinct</span>
                  <input type="range" min="1" max="10" value={formDecision} onChange={e => setFormDecision(parseInt(e.target.value))} />
                  <span className="slider-end">Analyse</span>
                </div>
              </div>

              <div className="slider-block">
                <label className="label">Rapport au risque</label>
                <div className="slider-row">
                  <span className="slider-end">Prudent</span>
                  <input type="range" min="1" max="10" value={formRisk} onChange={e => setFormRisk(parseInt(e.target.value))} />
                  <span className="slider-end">Audacieux</span>
                </div>
              </div>

              <div className="field">
                <label className="label">Style de communication <span className="label-hint">(1 ou 2 max)</span></label>
                <div className="chips">
                  {CHIPS.map(chip => (
                    <span key={chip} className={`chip${selectedChips.includes(chip) ? ' chip-on' : ''}`} onClick={() => toggleChip(chip)}>{chip}</span>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="label">Ta vision du monde en une phrase</label>
                <textarea value={formVision} onChange={e => setFormVision(e.target.value)} placeholder="Ce en quoi tu crois vraiment, sans filtre…" />
              </div>

              {createErr && <div className="err">{createErr}</div>}

              <div className="btn-row">
                <Link href="/" className="btn-ghost">← Retour</Link>
                <button className="btn-primary" onClick={submitMyAgent}>Choisir un adversaire →</button>
              </div>
            </div>
          )}

          {/* ── PICK OPPONENT ────────────────────── */}
          {screen === 'pick' && myAgent && (
            <div className="screen fade-in">
              <div className="screen-head">
                <div className="eyebrow">Étape 2 sur 2</div>
                <h1 className="screen-title">Choisis ton adversaire</h1>
                <p className="screen-sub">Sélectionne l&apos;agent avec qui tu veux débattre.</p>
              </div>

              <div className="my-banner">
                <div className="my-ava" style={{ background: myAgent.color.bg, color: myAgent.color.text }}>
                  {getInitials(myAgent.name)}
                </div>
                <div className="my-info">
                  <div className="my-name">{myAgent.name}</div>
                  <div className="my-sub">{myAgent.age} ans · {myAgent.city} · {myAgent.passion}</div>
                </div>
                <div className="my-tag">Mon agent</div>
              </div>

              <div className="section-label">Agents disponibles</div>
              <div className="agent-list">
                {SEED_AGENTS.map(ag => (
                  <div
                    key={ag.id}
                    className={`agent-card${selectedAgent?.id === ag.id ? ' agent-card-on' : ''}`}
                    onClick={() => setSelectedAgent(ag)}
                  >
                    <div className="agent-ava" style={{ background: ag.color.bg, color: ag.color.text }}>
                      {getInitials(ag.name)}
                    </div>
                    <div className="agent-info">
                      <div className="agent-name">{ag.name}</div>
                      <div className="agent-sub">{ag.age} ans · {ag.city} · {ag.passion}</div>
                      <div className="agent-tags">
                        {ag.comm.map(c => <span key={c} className="tag">{c}</span>)}
                        <span className="tag">{ag.risk >= 7 ? 'Audacieux' : ag.risk <= 3 ? 'Prudent' : 'Modéré'}</span>
                      </div>
                    </div>
                    <div className="check">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              <div className="btn-row">
                <button className="btn-ghost" onClick={() => goTo('create')}>← Modifier mon profil</button>
                <button className="btn-primary" onClick={() => goTo('topic')} disabled={!selectedAgent}>Choisir le sujet →</button>
              </div>
            </div>
          )}

          {/* ── TOPIC ────────────────────────────── */}
          {screen === 'topic' && myAgent && selectedAgent && (
            <div className="screen fade-in">
              <div className="screen-head">
                <h1 className="screen-title">Quel sujet ?</h1>
                <p className="screen-sub">Une question, une idée, une opinion — n&apos;importe quoi.</p>
              </div>

              <div className="vs-bar">
                <div className="vs-side">
                  <div className="vs-ava" style={{ background: myAgent.color.bg, color: myAgent.color.text }}>{getInitials(myAgent.name)}</div>
                  <div>
                    <div className="vs-name">{myAgent.name}</div>
                    <div className="vs-passion">{myAgent.passion}</div>
                  </div>
                </div>
                <div className="vs-label">VS</div>
                <div className="vs-side vs-side-r">
                  <div>
                    <div className="vs-name">{selectedAgent.name}</div>
                    <div className="vs-passion">{selectedAgent.passion}</div>
                  </div>
                  <div className="vs-ava" style={{ background: selectedAgent.color.bg, color: selectedAgent.color.text }}>{getInitials(selectedAgent.name)}</div>
                </div>
              </div>

              <textarea
                className="topic-input"
                value={topicValue}
                onChange={e => setTopicValue(e.target.value)}
                placeholder="ex: Faut-il quitter son CDI pour lancer sa startup ?"
              />

              <div className="examples">
                {TOPIC_EXAMPLES.map(([full, label]) => (
                  <span key={label} className="ex" onClick={() => setTopicValue(full)}>{label}</span>
                ))}
              </div>

              {topicErr && <div className="err">{topicErr}</div>}

              <div className="btn-row" style={{ marginTop: '1.5rem' }}>
                <button className="btn-ghost" onClick={() => goTo('pick')}>← Retour</button>
                <button className="btn-primary" onClick={launchDebate}>Lancer le débat →</button>
              </div>
            </div>
          )}

          {/* ── LOADING ──────────────────────────── */}
          {screen === 'loading' && (
            <div className="screen fade-in">
              <div className="loading-wrap">
                <div className="loading-ring">
                  <div className="loading-inner" />
                </div>
                <div className="loading-title">Débat en cours…</div>
                <div className="loading-msg">{loadingMsg}</div>
                <div className="track">
                  {turnTrack.map((state, i) => (
                    <div key={i} className={`track-dot${state === 'done' ? ' done' : state === 'active' ? ' active' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RESULT ───────────────────────────── */}
          {screen === 'result' && myAgent && selectedAgent && turns.length > 0 && (
            <div className="screen fade-in">
              <div className="result-header">
                <div className="result-ava" style={{ background: myAgent.color.bg, color: myAgent.color.text }}>{getInitials(myAgent.name)}</div>
                <div className="result-topic-wrap">
                  <div className="result-topic-label">Sujet débattu</div>
                  <div className="result-topic">{currentTopic}</div>
                </div>
                <div className="result-ava" style={{ background: selectedAgent.color.bg, color: selectedAgent.color.text }}>{getInitials(selectedAgent.name)}</div>
              </div>

              <div className="messages">
                {turns.map((t, i) => (
                  <div key={i} className={`msg msg-${t.isMe ? 'left' : 'right'}`} style={{ animationDelay: `${i * 0.07}s` }}>
                    <div className="msg-ava" style={{ background: t.isMe ? myAgent.color.bg : selectedAgent.color.bg, color: t.isMe ? myAgent.color.text : selectedAgent.color.text }}>
                      {getInitials(t.speaker)}
                    </div>
                    <div className="msg-body">
                      <div className="msg-name">{t.speaker}</div>
                      <div className="msg-bubble">{t.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="synthesis">
                <div className="synth-label">Synthèse</div>
                <div className="synth-text">{synthesis}</div>
              </div>

              <div className="result-actions">
                <button className="btn-ghost" onClick={() => goTo('topic')}>Nouveau sujet</button>
                <button className="btn-ghost" onClick={() => goTo('pick')}>Changer d&apos;agent</button>
                <button className="btn-primary" onClick={fullRestart}>Recommencer</button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #faf8f4;
          color: #1a1a1a;
          font-family: 'DM Sans', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <style jsx>{`
        .app {
          --acc: #ff4d1c;
          --acc-d: #e03a0c;
          --bg: #faf8f4;
          --bg2: #f2efe9;
          --bg3: #eeeae2;
          --text: #1a1a1a;
          --muted: #7a7670;
          --border: rgba(26,26,26,.1);
          --border2: rgba(26,26,26,.07);
          --r: 10px;
          min-height: 100vh;
          background: var(--bg);
        }

        /* NAV */
        .nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(250,248,244,.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border2);
        }
        .nav-in {
          max-width: 600px; margin: 0 auto;
          padding: 0 1.5rem; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: .95rem; letter-spacing: .08em;
          color: var(--text); text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }
        .logo-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--acc); flex-shrink: 0;
        }
        .nav-step {
          font-size: 11px; font-weight: 600;
          letter-spacing: .06em; color: var(--muted);
        }

        /* CONTENT */
        .content {
          max-width: 600px; margin: 0 auto;
          padding: 2.5rem 1.5rem 5rem;
        }

        /* SCREEN */
        .screen { }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeUp .25s ease both; }

        .screen-head { margin-bottom: 2rem; }
        .eyebrow {
          font-size: 10px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase;
          color: var(--acc); margin-bottom: .5rem;
        }
        .screen-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem; font-weight: 700;
          letter-spacing: -.02em; color: var(--text);
          margin-bottom: .35rem;
        }
        .screen-sub { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

        /* FORM */
        .field { margin-bottom: 1.1rem; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .label {
          display: block; font-size: 11px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 6px;
        }
        .label-hint { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 11px; }
        input[type=text], input[type=number], input:not([type=range]):not([type=checkbox]) {
          width: 100%;
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: var(--r);
          padding: 10px 13px;
          font-size: 14px; font-family: inherit; color: var(--text);
          outline: none; transition: border-color .15s;
          -webkit-appearance: none;
        }
        input:focus { border-color: var(--acc); }
        textarea {
          width: 100%; background: #fff;
          border: 1.5px solid var(--border); border-radius: var(--r);
          padding: 10px 13px; font-size: 14px;
          font-family: inherit; color: var(--text);
          outline: none; resize: none; height: 72px;
          line-height: 1.55; transition: border-color .15s;
        }
        textarea:focus { border-color: var(--acc); }

        /* SLIDERS */
        .slider-block { margin-bottom: 1.1rem; }
        .slider-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .slider-end { font-size: 11px; color: var(--muted); white-space: nowrap; }
        input[type=range] {
          flex: 1; -webkit-appearance: none;
          height: 3px; background: var(--bg3); border-radius: 2px; outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px;
          border-radius: 50%; background: var(--acc);
          cursor: pointer; border: 2.5px solid #fff;
          box-shadow: 0 1px 4px rgba(255,77,28,.3);
        }

        /* CHIPS */
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .chip {
          padding: 6px 14px; border-radius: 20px;
          border: 1.5px solid var(--border);
          background: #fff;
          font-size: 12.5px; cursor: pointer; color: var(--muted);
          transition: all .15s; user-select: none;
        }
        .chip:hover { color: var(--text); border-color: rgba(26,26,26,.2); }
        .chip-on { background: rgba(255,77,28,.08); border-color: rgba(255,77,28,.35); color: var(--acc); }

        /* BUTTONS */
        .btn-primary {
          background: var(--acc); color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          padding: 11px 22px; border-radius: var(--r);
          border: none; cursor: pointer; transition: all .15s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover { background: var(--acc-d); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,77,28,.25); }
        .btn-primary:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-ghost {
          background: transparent; color: var(--muted);
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400;
          padding: 11px 0; border: none; cursor: pointer;
          transition: color .15s; text-decoration: none; display: inline-block;
        }
        .btn-ghost:hover { color: var(--text); }
        .btn-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 1.75rem;
        }

        /* MY AGENT BANNER */
        .my-banner {
          display: flex; align-items: center; gap: 12px;
          background: #fff; border: 1.5px solid rgba(255,77,28,.2);
          border-radius: 12px; padding: 13px 15px; margin-bottom: 1.75rem;
        }
        .my-ava {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: .95rem; font-weight: 700; flex-shrink: 0;
        }
        .my-info { flex: 1; min-width: 0; }
        .my-name { font-size: 14px; font-weight: 600; color: var(--text); }
        .my-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .my-tag {
          font-size: 10px; color: var(--acc);
          background: rgba(255,77,28,.08); border: 1px solid rgba(255,77,28,.2);
          padding: 3px 9px; border-radius: 10px; white-space: nowrap; flex-shrink: 0;
          font-weight: 600; letter-spacing: .04em;
        }

        /* SECTION LABEL */
        .section-label {
          font-size: 10px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 10px;
        }

        /* AGENT LIST */
        .agent-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
        .agent-card {
          background: #fff; border: 1.5px solid var(--border2);
          border-radius: 12px; padding: 13px 15px;
          cursor: pointer; transition: all .15s;
          display: flex; align-items: center; gap: 12px;
        }
        .agent-card:hover { border-color: var(--border); background: var(--bg2); }
        .agent-card-on { border-color: rgba(255,77,28,.35); background: rgba(255,77,28,.04); }
        .agent-ava {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: .9rem; font-weight: 700; flex-shrink: 0;
        }
        .agent-info { flex: 1; min-width: 0; }
        .agent-name { font-size: 14px; font-weight: 500; color: var(--text); }
        .agent-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .agent-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
        .tag {
          font-size: 10px; padding: 2px 7px; border-radius: 6px;
          background: var(--bg3); color: var(--muted);
          border: 1px solid var(--border2);
        }
        .check {
          width: 22px; height: 22px; border-radius: 50%;
          border: 1.5px solid var(--border); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s; color: transparent;
        }
        .agent-card-on .check { background: var(--acc); border-color: var(--acc); color: #fff; }

        /* VS BAR */
        .vs-bar {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1.5px solid var(--border2);
          border-radius: 12px; padding: 12px 14px; margin-bottom: 1.25rem;
        }
        .vs-side { display: flex; align-items: center; gap: 9px; flex: 1; }
        .vs-side-r { justify-content: flex-end; }
        .vs-side-r > div:first-child { text-align: right; }
        .vs-ava {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; flex-shrink: 0;
        }
        .vs-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .vs-passion { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .vs-label {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800;
          color: var(--muted); letter-spacing: .06em; flex-shrink: 0;
        }

        /* TOPIC INPUT */
        .topic-input {
          width: 100%; background: #fff;
          border: 1.5px solid var(--border); border-radius: var(--r);
          padding: 13px 15px; font-size: 15px;
          font-family: inherit; color: var(--text);
          outline: none; resize: none; height: 90px;
          line-height: 1.55; transition: border-color .15s;
        }
        .topic-input:focus { border-color: var(--acc); }
        .examples { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
        .ex {
          padding: 5px 11px; border-radius: 6px;
          background: #fff; font-size: 11.5px;
          color: var(--muted); cursor: pointer;
          border: 1px solid var(--border2); transition: all .15s;
        }
        .ex:hover { color: var(--acc); border-color: rgba(255,77,28,.25); background: rgba(255,77,28,.04); }

        /* LOADING */
        .loading-wrap { text-align: center; padding: 4rem 1rem; }
        .loading-ring {
          width: 56px; height: 56px; border-radius: 50%;
          border: 2px solid rgba(255,77,28,.15);
          margin: 0 auto 1.5rem;
          display: flex; align-items: center; justify-content: center;
          animation: spin-ring 3s linear infinite;
        }
        @keyframes spin-ring { to { transform: rotate(360deg); } }
        .loading-inner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--acc);
          animation: spin-inner 1s linear infinite;
        }
        @keyframes spin-inner { to { transform: rotate(360deg); } }
        .loading-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 600; color: var(--text); margin-bottom: .4rem; }
        .loading-msg { font-size: 13px; color: var(--muted); min-height: 20px; }
        .track { display: flex; gap: 6px; justify-content: center; margin-top: 1.75rem; }
        .track-dot { width: 26px; height: 3px; border-radius: 2px; background: var(--bg3); transition: all .3s; }
        .track-dot.done { background: #22c55e; }
        .track-dot.active { background: var(--acc); animation: blink .8s ease infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }

        /* RESULT */
        .result-header {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1.5px solid var(--border2);
          border-radius: 12px; padding: 12px 14px; margin-bottom: 1.5rem;
        }
        .result-ava {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; flex-shrink: 0;
        }
        .result-topic-wrap { flex: 1; }
        .result-topic-label { font-size: 10px; color: var(--muted); font-weight: 500; }
        .result-topic { font-size: 13.5px; font-weight: 600; color: var(--text); margin-top: 2px; }

        .messages { display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.25rem; }
        @keyframes msgIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; } }
        .msg { display: flex; gap: 9px; align-items: flex-start; animation: msgIn .3s ease both; }
        .msg-right { flex-direction: row-reverse; }
        .msg-ava {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
        }
        .msg-body { max-width: 82%; }
        .msg-name { font-size: 10px; color: var(--muted); margin-bottom: 4px; font-weight: 600; }
        .msg-right .msg-name { text-align: right; }
        .msg-bubble { padding: 10px 13px; border-radius: 3px 11px 11px 11px; font-size: 13px; line-height: 1.65; }
        .msg-left .msg-bubble { background: var(--bg2); border: 1px solid var(--border2); color: var(--text); }
        .msg-right .msg-bubble { background: rgba(255,77,28,.07); border: 1px solid rgba(255,77,28,.15); color: #2a0f06; border-radius: 11px 3px 11px 11px; }

        .synthesis {
          background: #fff; border: 1.5px solid var(--border2);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 1.25rem;
        }
        .synth-label {
          font-size: 10px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #16a34a; margin-bottom: 7px;
        }
        .synth-text { font-size: 13px; line-height: 1.75; color: var(--muted); }

        .result-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ERROR */
        .err {
          background: rgba(255,77,28,.06); border: 1px solid rgba(255,77,28,.2);
          border-radius: 8px; padding: 10px 13px;
          font-size: 13px; color: #cc3300; margin-top: 10px;
        }
      `}</style>
    </>
  )
}
