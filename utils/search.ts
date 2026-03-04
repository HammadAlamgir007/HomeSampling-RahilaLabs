export function searchItems<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
): T[] {
  if (!searchTerm.trim()) return items

  const lowerSearch = searchTerm.toLowerCase()
  return items.filter((item) => searchFields.some((field) => String(item[field]).toLowerCase().includes(lowerSearch)))
}

export function filterByStatus<T extends { status?: string }>(items: T[], status: string): T[] {
  if (status === "all") return items
  return items.filter((item) => item.status === status)
}

export function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  startDate: string,
  endDate: string,
): T[] {
  return items.filter((item) => {
    const date = new Date(String(item[dateField]))
    const start = new Date(startDate)
    const end = new Date(endDate)
    return date >= start && date <= end
  })
}

export function sortItems<T extends Record<string, any>>(items: T[], sortField: keyof T, ascending = true): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]

    if (typeof aVal === "string") {
      return ascending ? aVal.localeCompare(String(bVal)) : String(bVal).localeCompare(aVal)
    }

    return ascending ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })
}
