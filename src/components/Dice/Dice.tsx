type DiceProps = {
  value: number | null
}

export function Dice({ value }: DiceProps) {
  return (
    <div className="dice">
      <span>{value ?? '–'}</span>
    </div>
  )
}

