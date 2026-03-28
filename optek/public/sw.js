/**
 * public/sw.js — Service Worker for Web Push Notifications
 *
 * Handles push events and notification clicks.
 * Registered by PushPermissionPrompt component.
 */

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'OpoRuta', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: data.tag || 'oporuta-notification',
    data: {
      url: data.url || '/',
    },
    // Vibrate on mobile
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'OpoRuta', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'
  const fullUrl = new URL(url, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(fullUrl)
          return client.focus()
        }
      }
      // Open new tab
      return self.clients.openWindow(fullUrl)
    })
  )
})
