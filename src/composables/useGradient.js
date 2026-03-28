// Genere un gradient unique a partir d'un nom (pour les avatars)
export function useGradient() {
  function generateGradient(name) {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue1 = hash % 360
    const hue2 = (hue1 + 40) % 360
    return `linear-gradient(135deg, hsl(${hue1}, 60%, 30%), hsl(${hue2}, 50%, 22%))`
  }

  return { generateGradient }
}
