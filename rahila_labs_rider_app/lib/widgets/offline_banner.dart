import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/connectivity_service.dart';
import '../services/offline_queue_service.dart';

/// A persistent banner shown at the top of the screen when the device is offline
/// or when there are pending queued actions waiting to be synced.
class OfflineBanner extends StatefulWidget {
  const OfflineBanner({super.key});

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends State<OfflineBanner> {
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    _isOnline = ConnectivityService.instance.isOnline;
    ConnectivityService.instance.onStatusChanged.listen((online) {
      if (mounted) setState(() => _isOnline = online);
    });
  }

  @override
  Widget build(BuildContext context) {
    final queue = context.watch<OfflineQueueService>();

    // Show nothing if online and no pending actions
    if (_isOnline && !queue.hasPending) return const SizedBox.shrink();

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: _isOnline ? Colors.orange[700] : Colors.red[700],
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            Icon(
              _isOnline ? Icons.cloud_upload : Icons.wifi_off,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _isOnline
                    ? '${queue.pendingCount} action${queue.pendingCount == 1 ? '' : 's'} syncing...'
                    : queue.hasPending
                        ? 'Offline — ${queue.pendingCount} action${queue.pendingCount == 1 ? '' : 's'} queued'
                        : 'You\'re offline — changes will sync on reconnect',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            if (queue.hasPending)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${queue.pendingCount}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
