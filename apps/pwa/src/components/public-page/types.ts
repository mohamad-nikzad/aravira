export type ServiceRow = {
  serviceId: string
  name: string
  category: string
  price: number
  visible: boolean
}

const tomansFormatter = new Intl.NumberFormat('fa-IR')

export function formatTomansPrice(n: number): string {
  return `${tomansFormatter.format(n)} تومان`
}
