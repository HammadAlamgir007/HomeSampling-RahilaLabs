import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Wraps connectivity_plus to expose a simple isOnline bool stream.
/// Singleton accessed via ConnectivityService.instance.
class ConnectivityService {
  ConnectivityService._();
  static final ConnectivityService instance = ConnectivityService._();

  final Connectivity _connectivity = Connectivity();

  bool _isOnline = true;
  bool get isOnline => _isOnline;

  StreamController<bool>? _controller;
  Stream<bool>? _stream;
  StreamSubscription<List<ConnectivityResult>>? _sub;

  /// Call once at app startup (e.g., in main.dart).
  Future<void> initialise() async {
    _controller = StreamController<bool>.broadcast();
    _stream = _controller!.stream;

    // Seed with current state
    final results = await _connectivity.checkConnectivity();
    _isOnline = _isConnected(results);

    _sub = _connectivity.onConnectivityChanged.listen((results) {
      final online = _isConnected(results);
      if (online != _isOnline) {
        _isOnline = online;
        _controller?.add(online);
        debugPrint('[Connectivity] Status changed → ${online ? "ONLINE" : "OFFLINE"}');
      }
    });
  }

  /// Broadcast stream of connectivity booleans.
  Stream<bool> get onStatusChanged => _stream ?? const Stream.empty();

  static bool _isConnected(List<ConnectivityResult> results) =>
      results.any((r) => r != ConnectivityResult.none);

  void dispose() {
    _sub?.cancel();
    _controller?.close();
  }
}
