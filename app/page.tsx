"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

export default function HomePage() {
  const [showVideo, setShowVideo] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [gifEnded, setGifEnded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasTriggeredRef = useRef(false) // This tracks if the animation has started
  const gifTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle click or button press
  const handleTrigger = () => {
    if (hasTriggeredRef.current) return // Animation already started

    hasTriggeredRef.current = true
    setTransitioning(true)

    // Play audio immediately on user interaction
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed:", err)
        // Fallback: If autoplay is blocked, you might consider showing a "Play Audio" button
        // or a message to the user.
      })
    }

    // Start transition
    setTimeout(() => {
      setShowVideo(true)

      // After transition completes, set timer for GIF end
      setTimeout(() => {
        setTransitioning(false)

        // Show final frame at exactly 12.6 seconds
        gifTimeoutRef.current = setTimeout(() => {
          setGifEnded(true)
        }, 12600) // 12.6 seconds
      }, 1000) // 1 second transition duration
    }, 50) // Small delay to ensure transition starts properly
  }

  // Gamepad input detection for Nintendo Switch controllers - client-side only
  useEffect(() => {
    let gamepadCheckInterval: NodeJS.Timeout | null = null

    const checkGamepads = () => {
      try {
        const gamepads = navigator.getGamepads?.()
        if (gamepads) {
          for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i]
            if (gamepad) {
              for (let j = 0; j < gamepad.buttons.length; j++) {
                if (gamepad.buttons[j]?.pressed && !hasTriggeredRef.current) {
                  handleTrigger()
                  return
                }
              }
            }
          }
        }
      } catch (error) {
        // Gamepad API might not be fully supported, ignore errors
      }
    }

    // Only set up gamepad detection on the client side
    gamepadCheckInterval = setInterval(checkGamepads, 100) // Check every 100ms

    // Clean up on unmount
    return () => {
      if (gamepadCheckInterval) {
        clearInterval(gamepadCheckInterval)
      }
      if (gifTimeoutRef.current) {
        clearTimeout(gifTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-black cursor-pointer"
      onClick={handleTrigger}
      aria-label="Click to start animation"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleTrigger()
        }
      }}
    >
      {/* Audio element - Removed typeof window check to fix hydration error */}
      <audio ref={audioRef} preload="auto" style={{ display: "none" }}>
        <source src="/audio.mp3" type="audio/mpeg" />
      </audio>

      {/* Initial static image - with 1 second fade */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${showVideo ? "opacity-0" : "opacity-100"}`}>
        <Image
          src="/image.png"
          alt="Nintendo Switch setup complete screen"
          fill
          priority
          className="object-contain object-top"
        />
      </div>

      {/* GIF animation layer - with 1 second fade in, stays visible until final frame appears */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${showVideo ? "opacity-100" : "opacity-0"}`}>
        <Image
          src="/video.gif"
          alt="Nintendo Switch startup animation"
          fill
          priority={false}
          unoptimized
          className="object-contain object-top"
        />
      </div>

      {/* Static final frame - appears instantly on top at 12.6 seconds */}
      {gifEnded && (
        <div className="absolute inset-0">
          <Image
            src="/final-frame.jpg"
            alt="Nintendo Switch home screen final frame"
            fill
            priority={false}
            className="object-contain object-top"
          />
        </div>
      )}
    </main>
  )
}
