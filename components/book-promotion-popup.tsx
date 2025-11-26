'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, X, Sparkles, Gift, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Confetti type
type ConfettiFn = (options: any) => Promise<null> | null

export function BookPromotionPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [email, setEmail] = useState('')
  const [showThankYou, setShowThankYou] = useState(false)
  const confettiTriggered = useRef(false)
  const confettiRef = useRef<ConfettiFn | null>(null)

  // Load confetti dynamically
  useEffect(() => {
    import('canvas-confetti').then((module) => {
      confettiRef.current = module.default
    }).catch(err => {
      console.error('Failed to load confetti:', err)
    })
  }, [])

  useEffect(() => {
    // Check if user has already dismissed or subscribed
    const dismissed = localStorage.getItem('book-promo-dismissed')
    const subscribed = localStorage.getItem('book-promo-subscribed')

    if (dismissed || subscribed) {
      return
    }

    // Show popup after 10 seconds to avoid overwhelming users
    const timer = setTimeout(() => {
      setIsVisible(true)
      // Small delay for animation
      setTimeout(() => setIsLoaded(true), 100)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  // Trigger confetti when popup becomes visible
  useEffect(() => {
    if (isVisible && isLoaded && !confettiTriggered.current && confettiRef.current) {
      confettiTriggered.current = true
      
      // Initial burst from multiple angles
      setTimeout(() => {
        if (!confettiRef.current) return

        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0 || !confettiRef.current) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)

          // Confetti from left side
          confettiRef.current({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'],
          })

          // Confetti from right side
          confettiRef.current({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'],
          })
        }, 250)
      }, 400) // Delay to sync with popup animation
    }
  }, [isVisible, isLoaded])

  const handleDismiss = () => {
    setIsLoaded(false)
    setTimeout(() => {
      setIsVisible(false)
      localStorage.setItem('book-promo-dismissed', 'true')
    }, 300)
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    // Submit to Mailchimp
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    // Open in new window (Mailchimp requirement)
    const mailchimpUrl = 'https://devops-daily.us2.list-manage.com/subscribe/post?u=d1128776b290ad8d08c02094f&id=fd76a4e93f&f_id=0022c6e1f0'
    const params = new URLSearchParams(formData as any).toString()
    window.open(\`\${mailchimpUrl}&\${params}\`, '_blank')

    // Show thank you message
    setShowThankYou(true)
    localStorage.setItem('book-promo-subscribed', 'true')

    // Celebration confetti for subscription (only if loaded)
    if (confettiRef.current) {
      confettiRef.current({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
        zIndex: 9999,
      })

      // Additional star burst
      setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
            zIndex: 9999,
          })
          confettiRef.current({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#10b981', '#f59e0b', '#ec4899'],
            zIndex: 9999,
          })
        }
      }, 200)
    }

    // Close popup after a moment
    setTimeout(() => {
      setIsLoaded(false)
      setTimeout(() => {
        setIsVisible(false)
      }, 300)
    }, 3000)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: isLoaded ? 1 : 0.9, opacity: isLoaded ? 1 : 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative"
          >
            <div className="relative w-[90vw] max-w-lg rounded-2xl bg-background/95 backdrop-blur-xl shadow-2xl border border-border overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground" />
              </button>

              {/* Gradient background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-600 to-pink-600" />

              {/* Content */}
              <div className="relative p-6 sm:p-8 md:p-10">
                {!showThankYou ? (
                  <>
                    {/* Header */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mb-4 sm:mb-6"
                    >
                      <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="relative">
                          <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-primary rounded-full blur-xl"
                          />
                        </div>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        🚀 Free DevOps Resources!
                      </h2>
                      <p className="text-base sm:text-lg text-muted-foreground">
                        Join thousands of developers getting weekly tips, tutorials, and ebooks! 📚
                      </p>
                    </motion.div>

                    {/* Feature highlights */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mb-4 sm:mb-6 space-y-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">✓</div>
                        <span>Expert tips & best practices 💡</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">✓</div>
                        <span>Real-world scenarios & solutions 🛠️</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs">✓</div>
                        <span>In-depth guides & tutorials 📖</span>
                      </div>
                    </motion.div>

                    {/* Newsletter signup */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl p-3 sm:p-4 md:p-5 border border-primary/20"
                    >
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <h4 className="font-semibold text-sm sm:text-base">Get Early Access & Updates! 🎉</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        Subscribe to be the first to know when the book launches + exclusive content! ✨
                      </p>

                      <form onSubmit={handleSubscribe} className="space-y-2 sm:space-y-3">
                        <input
                          type="email"
                          name="EMAIL"
                          id="mce-EMAIL"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />

                        {/* Honeypot */}
                        <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                          <input type="text" name="b_d1128776b290ad8d08c02094f_fd76a4e93f" tabIndex={-1} defaultValue="" />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-4 sm:py-5 md:py-6 text-sm sm:text-base rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                        >
                          <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Yes! Keep Me Updated 🚀
                        </Button>
                      </form>
                    </motion.div>

                    {/* Maybe later button */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-4 text-center"
                    >
                      <button
                        onClick={handleDismiss}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                      >
                        Maybe later
                      </button>
                    </motion.div>
                  </>
                ) : (
                  /* Thank you message */
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6 sm:py-8"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360, 720]
                      }}
                      transition={{ duration: 1 }}
                      className="mb-3 sm:mb-4 flex justify-center"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-3xl sm:text-4xl">
                        🎉
                      </div>
                    </motion.div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Thank You! ✨</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-2">
                      You're all set! Check your inbox for confirmation. 📬
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      We'll keep you posted on the book launch! 🚀
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
