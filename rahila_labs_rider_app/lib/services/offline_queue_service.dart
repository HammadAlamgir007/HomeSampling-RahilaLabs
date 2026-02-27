import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Supported queued action types.
enum QueuedActionType {
  markOnWay,
  markArrived,
  collectSample,
  deliverSample,
}

/// A single pending action that couldn't be sent while offline.
class QueuedAction {
  final QueuedActionType type;
  final int taskId;
  final Map<String, dynamic>? extra; // e.g. notes, photo path
  final DateTime queuedAt;
  final String id; // unique dedup key

  QueuedAction({
    required this.type,
    required this.taskId,
    this.extra,
    required this.queuedAt,
    required this.id,
  });

  factory QueuedAction.fromJson(Map<String, dynamic> json) => QueuedAction(
        type: QueuedActionType.values.firstWhere((e) => e.name == json['type']),
        taskId: json['taskId'] as int,
        extra: json['extra'] as Map<String, dynamic>?,
        queuedAt: DateTime.parse(json['queuedAt'] as String),
        id: json['id'] as String,
      );

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'taskId': taskId,
        if (extra != null) 'extra': extra,
        'queuedAt': queuedAt.toIso8601String(),
        'id': id,
      };

  String get displayLabel => switch (type) {
        QueuedActionType.markOnWay => 'Mark On the Way (Task #$taskId)',
        QueuedActionType.markArrived => 'Mark Arrived (Task #$taskId)',
        QueuedActionType.collectSample => 'Collect Sample (Task #$taskId)',
        QueuedActionType.deliverSample => 'Deliver to Lab (Task #$taskId)',
      };
}

/// Persists pending offline actions to SharedPreferences.
/// Call [flush] when connectivity is restored to replay them.
class OfflineQueueService extends ChangeNotifier {
  static const _prefsKey = 'offline_action_queue';

  List<QueuedAction> _queue = [];
  List<QueuedAction> get queue => List.unmodifiable(_queue);
  int get pendingCount => _queue.length;
  bool get hasPending => _queue.isNotEmpty;

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _load();
  }

  // ─── Enqueue ────────────────────────────────────────────────────────────────

  Future<void> enqueue(QueuedAction action) async {
    // Deduplicate: if identical type+task already queued, skip
    final exists = _queue.any((a) => a.type == action.type && a.taskId == action.taskId);
    if (exists) {
      debugPrint('[OfflineQueue] Duplicate action skipped: ${action.displayLabel}');
      return;
    }
    _queue.add(action);
    await _persist();
    notifyListeners();
    debugPrint('[OfflineQueue] Enqueued: ${action.displayLabel}');
  }

  // ─── Remove ─────────────────────────────────────────────────────────────────

  Future<void> remove(String actionId) async {
    _queue.removeWhere((a) => a.id == actionId);
    await _persist();
    notifyListeners();
  }

  Future<void> clear() async {
    _queue.clear();
    await _persist();
    notifyListeners();
  }

  // ─── Persistence ────────────────────────────────────────────────────────────

  void _load() {
    final raw = _prefs?.getString(_prefsKey);
    if (raw == null) return;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      _queue = list
          .map((e) => QueuedAction.fromJson(e as Map<String, dynamic>))
          .toList();
      if (_queue.isNotEmpty) {
        debugPrint('[OfflineQueue] Loaded ${_queue.length} pending action(s) from storage');
      }
    } catch (e) {
      debugPrint('[OfflineQueue] Failed to load queue: $e');
      _queue = [];
    }
  }

  Future<void> _persist() async {
    final raw = jsonEncode(_queue.map((a) => a.toJson()).toList());
    await _prefs?.setString(_prefsKey, raw);
  }
}
