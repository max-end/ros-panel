/**
 * Formats RouterOS compact uptime string (e.g. "5w6d17h45m30s") into intuitive human-readable format.
 * Example: "5w6d17h45m30s" -> "41天 17小时 45分"
 */
export function formatRosUptime(uptime?: string): string {
  if (!uptime || uptime === '--' || uptime === '0s') return uptime || '--';

  const weeksMatch = uptime.match(/(\d+)\s*w/i);
  const daysMatch = uptime.match(/(\d+)\s*d/i);
  const hoursMatch = uptime.match(/(\d+)\s*h/i);
  const minutesMatch = uptime.match(/(\d+)\s*m(?!s)/i);
  const secondsMatch = uptime.match(/(\d+)\s*s/i);

  // If no units matched at all, return raw string
  if (!weeksMatch && !daysMatch && !hoursMatch && !minutesMatch && !secondsMatch) {
    return uptime;
  }

  const weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 0;
  const rawDays = daysMatch ? parseInt(daysMatch[1], 10) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

  const totalDays = weeks * 7 + rawDays;

  if (totalDays > 0) {
    if (hours > 0) {
      return `${totalDays}天 ${hours}小时 ${minutes > 0 ? `${minutes}分` : ''}`.trim();
    }
    return `${totalDays}天 ${minutes > 0 ? `${minutes}分` : ''}`.trim();
  }

  if (hours > 0) {
    return `${hours}小时 ${minutes}分`;
  }

  if (minutes > 0) {
    return `${minutes}分 ${seconds > 0 ? `${seconds}秒` : ''}`.trim();
  }

  if (seconds > 0) {
    return `${seconds}秒`;
  }

  return uptime;
}

/**
 * Returns complete verbose breakdown for tooltips.
 * Example: "5周 6天 17小时 45分钟 30秒"
 */
export function formatRosUptimeDetailed(uptime?: string): string {
  if (!uptime || uptime === '--') return '--';

  const weeksMatch = uptime.match(/(\d+)\s*w/i);
  const daysMatch = uptime.match(/(\d+)\s*d/i);
  const hoursMatch = uptime.match(/(\d+)\s*h/i);
  const minutesMatch = uptime.match(/(\d+)\s*m(?!s)/i);
  const secondsMatch = uptime.match(/(\d+)\s*s/i);

  const parts: string[] = [];
  if (weeksMatch) parts.push(`${weeksMatch[1]}周`);
  if (daysMatch) parts.push(`${daysMatch[1]}天`);
  if (hoursMatch) parts.push(`${hoursMatch[1]}小时`);
  if (minutesMatch) parts.push(`${minutesMatch[1]}分钟`);
  if (secondsMatch) parts.push(`${secondsMatch[1]}秒`);

  return parts.length > 0 ? parts.join(' ') : uptime;
}
