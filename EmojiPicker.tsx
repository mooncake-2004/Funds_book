// EmojiPicker.tsx
// 精選財務分類 Emoji 選擇器（多場景覆蓋版）

import React from 'react';

// 精選 64 個最常用的生活與財務分類 Emoji
export const DEFAULT_EMOJIS = [
  '🍔', '☕️', '🍜', '🍻', '🍱', '🧋', '🍎', '🥩',
  '🛍️', '👕', '👟', '💄', '📱', '💻', '🧴', '🛒',
  '🎮', '🎬', '🎤', '🎳', '✈️', '🏖️', '⛺️', '🎟️',
  '🚇', '🚕', '🚌', '🚗', '⛽️', '🅿️', '🚲', '🚅',
  '🏠', '💡', '💧', '📶', '🧹', '🛋️', '📦', '🔧',
  '💊', '🏥', '🏋️', '🧘', '📚', '✏️', '🎓', '👓',
  '🐶', '🐱', '👶', '🍼', '🎁', '🧧', '💐', '💍',
  '💰', '💵', '📈', '🪙', '🏦', '💳', '🧾', '🛡️'
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmoji, onSelect }) => {
  return (
    <div className="emoji-picker-container">
      <div className="emoji-grid">
        {DEFAULT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>{`
        .emoji-picker-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          max-width: 360px;
        }
        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 6px;
          max-height: 200px;
          overflow-y: auto; /* 超出高度時支持微滑動 */
          padding-right: 4px;
        }
        .emoji-btn {
          font-size: 20px;
          background: none;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          padding: 6px 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, background 0.15s;
        }
        .emoji-btn:hover {
          background: #f1f5f9;
          transform: scale(1.2);
        }
        .emoji-btn.selected {
          background: #fef3c7;
          border-color: #f59e0b;
        }
      `}</style>
    </div>
  );
};
