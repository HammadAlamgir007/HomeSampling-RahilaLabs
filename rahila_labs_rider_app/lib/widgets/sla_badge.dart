import 'package:flutter/material.dart';
import '../models/task.dart';

/// Compact SLA urgency badge displayed on task cards and detail screens.
class SlaBadge extends StatelessWidget {
  final Task task;
  final bool compact;

  const SlaBadge({super.key, required this.task, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final urgency = task.slaUrgency;
    final mins = task.minutesToDeadline;

    // Don't show badge for completed/delivered tasks
    if (task.isDelivered || task.isCollected && urgency == SlaUrgency.ok) {
      return const SizedBox.shrink();
    }

    if (mins == null) return const SizedBox.shrink();

    final (color, icon, label) = _labelFor(urgency, mins, task.priorityLevel);

    if (compact) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withOpacity(0.6)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 3),
            Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w600),
          ),
          if (task.priorityLevel != 'normal') ...[
            const SizedBox(width: 8),
            _PriorityPill(priority: task.priorityLevel),
          ],
        ],
      ),
    );
  }

  static (Color, IconData, String) _labelFor(SlaUrgency urgency, int mins, String priority) {
    switch (urgency) {
      case SlaUrgency.breached:
        final overdue = (-mins);
        final text = overdue >= 60
            ? '${overdue ~/ 60}h ${overdue % 60}m'
            : '${overdue}m';
        return (Colors.red[700]!, Icons.warning_rounded, '⚠ Deadline Missed by $text');
      case SlaUrgency.warning:
        return (Colors.orange[700]!, Icons.timer_outlined, '${mins}m until deadline — Act now');
      case SlaUrgency.ok:
        final hours = mins ~/ 60;
        final rem = mins % 60;
        final text = hours > 0 ? '${hours}h ${rem}m' : '${mins}m';
        return (Colors.green[700]!, Icons.check_circle_outline, 'On track — $text left');
    }
  }
}

class _PriorityPill extends StatelessWidget {
  final String priority;
  const _PriorityPill({required this.priority});

  @override
  Widget build(BuildContext context) {
    final color = priority == 'critical' ? Colors.red : Colors.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        priority.toUpperCase(),
        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
      ),
    );
  }
}
