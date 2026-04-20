import Head from 'next/head'
import { useState } from 'react'

const SEED_AGENTS = [
  {
    id: 'seed1', name: 'Thomas D.', age: 34, city: 'Lyon', passion: 'Entrepreneuriat',
    decision: 8, risk: 9, comm: ['Direct', 'Provocateur'],
    vision: "Le confort est l'ennemi du progrès. Si tu n'es pas mal à l'aise, tu n'avances pas.",
    color: { bg: 'rgba(45,206,137,.1)', text: '#2dce89' },
  },
  {
    id: 'seed2', name: 'Camille R.', age: 29, city: 'Paris', passion: 'Design UX',
    decision: 5, risk: 4, comm: ['Empathique', 'Diplomatique'],
    vision: "Les meilleures décisions se prennent quand on comprend vraiment les gens qui les vivent.",
    color: { bg: 'rgba(77,166,255,.1)', text: '#4da6ff' },
  },
  {
    id: 'seed3', name: 'Alex M.', age: 41, city: 'Bordeaux', passion: 'Finance & investissement',
    decision: 9, risk: 6, comm: ['Analytique', 'Direct'],
    vision: "Les données ne mentent pas. Tout le reste, c'est du bruit.",
    color: { bg: 'rgba(255,200,80,.1)', text: '#ffc850' },
  },
  {
    id: 'seed4', name: 'Inès B.', age: 26, city: 'Marseille', passion: 'Créativité & art',
    decision: 3, risk: 7, comm: ['Sarcastique', 'Direct'],
    vision: "Le monde récompense les originaux. Copier c'est choisir la médiocrité.",
    color: { bg: 'rgba(255,100,200,.1)', text: '#ff64c8' },
  },
  {
    id: 'seed5', name: 'Karim T.', age: 38, city: 'Nantes', passion: 'Tech & IA',
    decision: 7, risk: 8, comm: ['Analytique', 'Provocateur'],
    vision: "On surestime ce que l'IA fera en 1 an et on sous-estime ce qu'elle fera en 10 ans.",
    color: { bg: 'rgba(160,100,255,.1)', text: '#a064ff' },
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

export default function Home() {
  const [screen, setScreen] = useState('home')

  // Form fields (controlled so they survive screen changes)
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
      id: 'me',
      name: formName,
      age: parseInt(formAge),
      city: formCity,
      passion: formPassion,
      decision: formDecision,
      risk: formRisk,
      comm: selectedChips,
      vision: formVision,
      color: { bg: 'rgba(255,92,43,.12)', text: '#ff5c2b' },
    })
    goTo('pick')
  }

  async function launchDebate() {
    if (!topicValue.trim()) {
      setTopicErr('Saisis un sujet de débat.')
      return
    }
    setTopicErr('')
    const topic = topicValue.trim()
    setCurrentTopic(topic)
    setTurnTrack(Array(6).fill('idle'))
    setTurns([])
    setSynthesis('')
    goTo('loading')

    const a1 = myAgent
    const a2 = selectedAgent
    const a1sys = buildSystem(a1)
    const a2sys = buildSystem(a2)
    const newTurns = []

    const loadMsgs = [
      `${a1.name} prend position…`,
      `${a2.name} réplique…`,
      `${a1.name} contre-attaque…`,
      `${a2.name} insiste…`,
      `${a1.name} conclut…`,
      `${a2.name} a le dernier mot…`,
    ]

    try {
      for (let i = 0; i < 6; i++) {
        setTurnTrack(prev => prev.map((v, idx) => idx === i ? 'active' : v))
        setLoadingMsg(loadMsgs[i])

        const isMe = i % 2 === 0
        const system = isMe ? a1sys : a2sys
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
      const synthPrompt = `Débat entre ${a1.name} et ${a2.name} sur : "${topic}"\n\n${transcript}\n\nSynthèse neutre en 3 phrases : position de chacun, point de convergence s'il y en a, désaccord principal.`
      const synthText = await callDebate('Tu es un modérateur de débat neutre et concis. Réponds en français.', [{ role: 'user', content: synthPrompt }])

      setTurns(newTurns)
      setSynthesis(synthText)
      goTo('result')
    } catch (e) {
      goTo('topic')
      setTopicErr(`Erreur API : ${e.message}`)
    }
  }

  function fullRestart() {
    setMyAgent(null)
    setSelectedAgent(null)
    setSelectedChips([])
    setTurns([])
    setSynthesis('')
    setCurrentTopic('')
    setTopicValue('')
    setFormName('')
    setFormAge('')
    setFormCity('')
    setFormPassion('')
    setFormDecision(5)
    setFormRisk(5)
    setFormVision('')
    goTo('create')
  }

  return (
    <>
      <Head>
        <title>PeopleView</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="app">
        <div className="logo"><div className="logo-dot" />PEOPLEVIEW</div>

        {/* HOME */}
        {screen === 'home' && (
          <div className="screen">
            <div className="page-title">Débats<br />entre <span>agents</span><br />réels.</div>
            <div className="page-sub">Crée ton agent IA en répondant à quelques questions. Puis choisis un agent existant et lance un débat sur n&apos;importe quel sujet.</div>
            <button className="btn btn-primary btn-full" onClick={() => goTo('create')}>Créer mon agent →</button>
          </div>
        )}

        {/* CREATE AGENT */}
        {screen === 'create' && (
          <div className="screen">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>Étape 1 sur 2</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>Crée ton agent</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Sois honnête — c&apos;est ça qui rend le débat authentique.</div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Prénom</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Sophie" />
              </div>
              <div className="field">
                <label className="field-label">Âge</label>
                <input type="number" value={formAge} onChange={e => setFormAge(e.target.value)} placeholder="28" />
              </div>
            </div>
            <div className="field">
              <label className="field-label">Ville</label>
              <input value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="Paris" />
            </div>
            <div className="field">
              <label className="field-label">Passion / expertise principale</label>
              <input value={formPassion} onChange={e => setFormPassion(e.target.value)} placeholder="Design, Investissement, Cuisine…" />
            </div>

            <div className="slider-wrap">
              <label className="field-label">Prise de décision</label>
              <div className="slider-row">
                <span className="slider-end">Instinct</span>
                <input type="range" min="1" max="10" value={formDecision} onChange={e => setFormDecision(parseInt(e.target.value))} />
                <span className="slider-end">Analyse</span>
              </div>
            </div>
            <div className="slider-wrap">
              <label className="field-label">Rapport au risque</label>
              <div className="slider-row">
                <span className="slider-end">Prudent</span>
                <input type="range" min="1" max="10" value={formRisk} onChange={e => setFormRisk(parseInt(e.target.value))} />
                <span className="slider-end">Audacieux</span>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Style de communication (1-2 max)</label>
              <div className="chips">
                {CHIPS.map(chip => (
                  <span key={chip} className={`chip${selectedChips.includes(chip) ? ' on' : ''}`} onClick={() => toggleChip(chip)}>{chip}</span>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Ta vision du monde en une phrase</label>
              <textarea value={formVision} onChange={e => setFormVision(e.target.value)} placeholder="Ce en quoi tu crois vraiment, sans filtre…" />
            </div>

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => goTo('home')}>← Retour</button>
              <button className="btn btn-primary" onClick={submitMyAgent}>Choisir un adversaire →</button>
            </div>
            {createErr && <div className="err">{createErr}</div>}
          </div>
        )}

        {/* PICK OPPONENT */}
        {screen === 'pick' && myAgent && (
          <div className="screen">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>Étape 2 sur 2</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>Choisis ton adversaire</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Sélectionne l&apos;agent avec qui tu veux débattre.</div>
            </div>

            <div className="my-agent-banner">
              <div className="my-agent-ava">{getInitials(myAgent.name)}</div>
              <div>
                <div className="my-agent-name">{myAgent.name}</div>
                <div className="my-agent-sub">{myAgent.age} ans · {myAgent.city} · {myAgent.passion}</div>
              </div>
              <div className="my-agent-tag">Mon agent</div>
            </div>

            <div className="section-label">Agents disponibles</div>
            <div className="agent-list">
              {SEED_AGENTS.map(ag => (
                <div
                  key={ag.id}
                  className={`agent-card${selectedAgent?.id === ag.id ? ' selected' : ''}`}
                  onClick={() => setSelectedAgent(ag)}
                >
                  <div className="agent-card-ava" style={{ background: ag.color.bg, color: ag.color.text }}>{getInitials(ag.name)}</div>
                  <div className="agent-card-info">
                    <div className="agent-card-name">{ag.name}</div>
                    <div className="agent-card-sub">{ag.age} ans · {ag.city} · {ag.passion}</div>
                    <div className="agent-card-tags">
                      {ag.comm.map(c => <span key={c} className="tag">{c}</span>)}
                      <span className="tag">{ag.risk >= 7 ? 'Audacieux' : ag.risk <= 3 ? 'Prudent' : 'Modéré'}</span>
                    </div>
                  </div>
                  <div className="check-circle">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => goTo('create')}>← Modifier mon profil</button>
              <button className="btn btn-primary" onClick={() => goTo('topic')} disabled={!selectedAgent}>Choisir le sujet →</button>
            </div>
          </div>
        )}

        {/* TOPIC */}
        {screen === 'topic' && myAgent && selectedAgent && (
          <div className="screen">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>Quel sujet ?</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Une question, une idée, une opinion — n&apos;importe quoi.</div>
            </div>

            <div className="topic-header">
              <div className="topic-ava" style={{ background: myAgent.color.bg, color: myAgent.color.text }}>{getInitials(myAgent.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="topic-names">{myAgent.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{myAgent.passion}</div>
              </div>
              <div className="topic-vs">VS</div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div className="topic-names">{selectedAgent.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{selectedAgent.passion}</div>
              </div>
              <div className="topic-ava" style={{ background: selectedAgent.color.bg, color: selectedAgent.color.text }}>{getInitials(selectedAgent.name)}</div>
            </div>

            <textarea
              className="topic-textarea"
              value={topicValue}
              onChange={e => setTopicValue(e.target.value)}
              placeholder="ex: Faut-il quitter son CDI pour lancer sa startup ?"
            />
            <div className="examples">
              {TOPIC_EXAMPLES.map(([full, label]) => (
                <span key={label} className="ex" onClick={() => setTopicValue(full)}>{label}</span>
              ))}
            </div>
            <div className="btn-row" style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => goTo('pick')}>← Retour</button>
              <button className="btn btn-primary" onClick={launchDebate}>Lancer le débat ⚡</button>
            </div>
            {topicErr && <div className="err">{topicErr}</div>}
          </div>
        )}

        {/* LOADING */}
        {screen === 'loading' && (
          <div className="screen">
            <div className="debate-loading">
              <div className="pulse-ring"><div className="pulse-inner">⚡</div></div>
              <div className="loading-title">Débat en cours…</div>
              <div className="loading-sub">{loadingMsg}</div>
              <div className="turn-track">
                {turnTrack.map((state, i) => (
                  <div key={i} className={`td${state === 'done' ? ' done' : state === 'active' ? ' active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {screen === 'result' && myAgent && selectedAgent && turns.length > 0 && (
          <div className="screen">
            <div className="debate-participants">
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0, background: myAgent.color.bg, color: myAgent.color.text }}>{getInitials(myAgent.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="debate-topic-label">Sujet débattu</div>
                <div className="debate-topic-text">{currentTopic}</div>
              </div>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0, background: selectedAgent.color.bg, color: selectedAgent.color.text }}>{getInitials(selectedAgent.name)}</div>
            </div>

            <div className="messages">
              {turns.map((t, i) => (
                <div key={i} className={`msg ${t.isMe ? 'left' : 'right'}`} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="msg-ava" style={{ background: t.isMe ? myAgent.color.bg : selectedAgent.color.bg, color: t.isMe ? myAgent.color.text : selectedAgent.color.text }}>{getInitials(t.speaker)}</div>
                  <div className="msg-inner">
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
              <button className="btn btn-ghost" onClick={() => goTo('topic')}>Nouveau sujet</button>
              <button className="btn btn-ghost" onClick={() => goTo('pick')}>Changer d&apos;agent</button>
              <button className="btn btn-primary" onClick={fullRestart}>Rejouer</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
