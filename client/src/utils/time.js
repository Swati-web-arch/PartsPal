// client/src/utils/time.js

export const GRACE_PERIOD_MINUTES = 10;

/**
 * Calculates due status with grace period.
 * @param {string} dueDateISO - ISO string of expected return time
 * @param {string} returnedAtISO - ISO string if already returned
 * @returns {object} { isOverdue: boolean, inGracePeriod: boolean, label: string, color: string }
 */
export function getDueStatus(dueDateISO, returnedAtISO) {
  if (returnedAtISO) {
    return {
      isOverdue: false,
      inGracePeriod: false,
      label: `Returned ${new Date(returnedAtISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: '#16a34a'
    };
  }

  if (!dueDateISO) {
    return { isOverdue: false, inGracePeriod: false, label: 'Active', color: '#64748b' };
  }

  const now = Date.now();
  const due = new Date(dueDateISO).getTime();
  const graceEnd = due + GRACE_PERIOD_MINUTES * 60 * 1000;
  const diffMs = due - now;

  // 1. Definite Overdue: beyond due date + grace period
  if (now > graceEnd) {
    const overdueMinutes = Math.floor((now - due) / (60 * 1000));
    const hours = Math.floor(overdueMinutes / 60);
    const mins = overdueMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return {
      isOverdue: true,
      inGracePeriod: false,
      label: `⚠️ Overdue by ${timeStr}`,
      color: '#dc2626'
    };
  }

  // 2. In Grace Period: between due date and due date + 10 min
  if (now > due && now <= graceEnd) {
    const graceLeftMin = Math.ceil((graceEnd - now) / (60 * 1000));
    return {
      isOverdue: true, // flagged
      inGracePeriod: true,
      label: `⏳ Grace Period (${graceLeftMin}m left)`,
      color: '#d97706'
    };
  }

  // 3. Not yet due: Future
  const remainingMin = Math.floor(diffMs / (60 * 1000));
  if (remainingMin < 60) {
    return {
      isOverdue: false,
      inGracePeriod: false,
      label: `Due in ${remainingMin}m`,
      color: '#2563eb'
    };
  }

  const remainingHours = Math.floor(remainingMin / 60);
  const remainingDays = Math.floor(remainingHours / 24);

  if (remainingDays > 0) {
    return {
      isOverdue: false,
      inGracePeriod: false,
      label: `Due in ${remainingDays}d ${remainingHours % 24}h`,
      color: '#475569'
    };
  }

  return {
    isOverdue: false,
    inGracePeriod: false,
    label: `Due in ${remainingHours}h ${remainingMin % 60}m`,
    color: '#475569'
  };
}
