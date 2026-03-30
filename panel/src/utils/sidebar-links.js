export const getSidebarLinkPath = (link = {}) => link?.route || link?.childLink || ''

export const deriveLabelFromPath = (value = '') =>
  value
    .split('/')
    .filter(Boolean)
    .pop()
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Dashboard'

export const getSidebarLinkLabel = (link = {}) => {
  if (link?.label) return link.label
  if (link?.isParentOnly) return link?.parentLink || 'Navigation Group'

  const path = getSidebarLinkPath(link)
  return deriveLabelFromPath(path)
}
