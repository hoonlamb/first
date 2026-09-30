/** Skip link that works with the hash router (a plain href="#main" would be read as a route). */
export function SkipLink() {
  return (
    <a className="skip" href="#main" onClick={(e) => {
      e.preventDefault()
      const main = document.getElementById('main')
      if (!main) return
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
      main.focus()
      main.scrollIntoView()
    }}>본문 바로가기</a>
  )
}
