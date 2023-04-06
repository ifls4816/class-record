export const db = window.electronAPI.store
;(() => {
  const student = db.get('student')
  const study = db.get('class')
  if (!student) {
    db.set('student', [])
  }
  if (!study) {
    db.set('class', {})
  }
})()
