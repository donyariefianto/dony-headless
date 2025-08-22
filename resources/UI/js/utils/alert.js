export function showNotification(message, type) {
  const notificationElement = type === 'success' ? successMessage : errorMessage
  notificationElement.textContent = message
  notificationElement.style.display = 'block'
  setTimeout(() => {
    notificationElement.style.display = 'none'
    notificationElement.textContent = '' // Clear message
  }, 5000) // Hide after 5 seconds
}
