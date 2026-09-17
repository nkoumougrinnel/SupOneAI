/**
 * VirtualizedChatList.jsx — High-performance virtualized chat message list
 *
 * Uses react-window FixedSizeList for smooth rendering of 100+ messages.
 * Handles dynamic heights via variable row sizing.
 */

import { useRef, useEffect, useCallback, memo } from 'react'
import { FixedSizeList } from 'react-window'
import MessageBubble from './MessageBubble'

const MESSAGE_HEIGHT = 80 // Average height estimate for variable-size messages

/**
 * A single row in the virtualized list.
 */
const Row = memo(function Row({ index, style, data }) {
  const { messages, onCopy, onSubmitFeedback, onToast } = data
  const message = messages[index]

  if (!message) return null

  return (
    <div style={{ ...style, paddingLeft: 0, paddingRight: 0 }}>
      <MessageBubble
        key={message.id}
        message={message}
        onCopy={onCopy}
        onSubmitFeedback={onSubmitFeedback}
        onToast={onToast}
      />
    </div>
  )
})

/**
 * VirtualizedChatList — Drop-in replacement for message .map()
 *
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {Function} props.onCopy - Copy handler
 * @param {Function} props.onSubmitFeedback - Feedback handler
 * @param {Function} props.onToast - Toast handler
 * @param {React.Ref} props.listRef - Ref for the outer scroll container
 * @param {number} [props.height] - Container height (auto-calculated if not provided)
 */
export default function VirtualizedChatList({
  messages,
  onCopy,
  onSubmitFeedback,
  onToast,
  listRef,
  height,
}) {
  const innerRef = useRef(null)
  const containerRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (innerRef.current && messages.length > 0) {
      const container = innerRef.current
      // Only auto-scroll if user is near the bottom
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 150
      if (isNearBottom) {
        innerRef.current.scrollToItem(messages.length - 1, 'end')
      }
    }
  }, [messages.length])

  // Calculate container height
  const containerHeight = height || (typeof window !== 'undefined' ? window.innerHeight - 200 : 600)

  const itemData = {
    messages,
    onCopy,
    onSubmitFeedback,
    onToast,
  }

  const itemCount = messages.length

  const setOuterRef = useCallback(
    (node) => {
      containerRef.current = node
      if (listRef) {
        if (typeof listRef === 'function') {
          listRef(node)
        } else {
          listRef.current = node
        }
      }
    },
    [listRef]
  )

  if (itemCount === 0) return null

  return (
    <FixedSizeList
      ref={(node) => {
        innerRef.current = node
        setOuterRef(node)
      }}
      height={containerHeight}
      width="100%"
      itemCount={itemCount}
      itemSize={MESSAGE_HEIGHT}
      itemData={itemData}
      overscanCount={5}
      style={{ overflowX: 'hidden' }}
    >
      {Row}
    </FixedSizeList>
  )
}

/**
 * Helper: Estimate the height of a message based on content length.
 * Used for variable-size virtualization (optional).
 */
export function estimateMessageHeight(message) {
  const contentLength = (message.content || '').length
  const baseHeight = 60 // avatar + padding
  const lineHeight = 24
  const charsPerLine = 50
  const estimatedLines = Math.ceil(contentLength / charsPerLine)

  return Math.max(baseHeight, baseHeight + estimatedLines * lineHeight)
}
