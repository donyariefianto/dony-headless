const buttons = document.querySelectorAll('.nav-btn')
const contents = document.querySelectorAll('.submenu-content')

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    // Remove all active
    buttons.forEach((b) => b.classList.remove('active'))
    contents.forEach((c) => c.classList.remove('active'))

    // Activate current
    btn.classList.add('active')
    const target = btn.getAttribute('data-target')
    document.getElementById(target).classList.add('active')
  })
})
