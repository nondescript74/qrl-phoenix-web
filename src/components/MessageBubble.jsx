export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`msg-row ${isUser ? 'msg-user' : 'msg-assistant'}`}>
      <div className={`msg-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        {content.split('\n').map((line, i) => (
          <p key={i} className="msg-line">{line || '\u00A0'}</p>
        ))}
      </div>
    </div>
  )
}
