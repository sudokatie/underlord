'use client';

interface MessageLogProps {
  messages: string[];
}

export default function MessageLog({ messages }: MessageLogProps) {
  // Show last 5 messages
  const recentMessages = messages.slice(-5);

  return (
    <div className="absolute bottom-0 left-0 right-48 p-2 bg-black/70 text-white text-sm">
      {recentMessages.length === 0 ? (
        <p className="text-gray-500 italic">No messages</p>
      ) : (
        recentMessages.map((msg, i) => (
          <p key={i} className="text-gray-300">
            {msg}
          </p>
        ))
      )}
    </div>
  );
}
