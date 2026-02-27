import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/rider_provider.dart';
import 'screens/login_screen.dart';
import 'services/connectivity_service.dart';
import 'services/offline_queue_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise connectivity detection (Phase 10)
  await ConnectivityService.instance.initialise();

  // Initialise offline queue and restore any persisted actions (Phase 10)
  final offlineQueue = OfflineQueueService();
  await offlineQueue.init();

  runApp(MyApp(offlineQueue: offlineQueue));
}

class MyApp extends StatelessWidget {
  final OfflineQueueService offlineQueue;
  const MyApp({super.key, required this.offlineQueue});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => RiderProvider()),
        ChangeNotifierProvider<OfflineQueueService>.value(value: offlineQueue),
      ],
      child: MaterialApp(
        title: 'Rahila Labs Rider',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
          cardTheme: CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),
        home: const LoginScreen(),
      ),
    );
  }
}
