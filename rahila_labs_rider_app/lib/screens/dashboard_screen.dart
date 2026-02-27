import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/rider_provider.dart';
import '../models/task.dart';
import 'task_detail_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import '../widgets/sla_badge.dart';
import '../widgets/offline_banner.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RiderProvider>(context, listen: false).loadTasks();
    });
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      const TasksTab(),
      const HistoryScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rider Dashboard'),
        actions: [
          Consumer<RiderProvider>(
            builder: (context, provider, child) {
              return PopupMenuButton<String>(
                icon: Icon(
                  Icons.circle,
                  color: _getStatusColor(provider.rider?.availabilityStatus ?? 'offline'),
                ),
                onSelected: (value) async {
                  // Offline protection: warn if rider has active tasks
                  if (value == 'offline' && provider.activeTaskCount > 0) {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        title: const Row(
                          children: [
                            Icon(Icons.warning_amber, color: Colors.orange),
                            SizedBox(width: 8),
                            Text('Go Offline?'),
                          ],
                        ),
                        content: Text(
                          'You have ${provider.activeTaskCount} active task(s).\n\n'
                          'Going offline will not cancel them, but you won\'t receive new assignments.\n\n'
                          'Are you sure?',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: const Text('Cancel'),
                          ),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            child: const Text('Go Offline', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    );
                    if (confirmed != true || !context.mounted) return;
                  }

                  // Show loading
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Updating status to $value...'),
                        duration: const Duration(seconds: 1),
                      ),
                    );
                  }

                  // Update status
                  await provider.updateStatus(value);
                  
                  // Show result
                  if (provider.error != null) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error: ${provider.error}'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                    provider.clearError();
                  } else {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Status updated to ${value.toUpperCase()}'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'available',
                    child: Row(
                      children: [
                        Icon(Icons.circle, color: Colors.green, size: 16),
                        SizedBox(width: 8),
                        Text('Available'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'busy',
                    child: Row(
                      children: [
                        Icon(Icons.circle, color: Colors.orange, size: 16),
                        SizedBox(width: 8),
                        Text('Busy'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'offline',
                    child: Row(
                      children: [
                        Icon(Icons.circle, color: Colors.grey, size: 16),
                        SizedBox(width: 8),
                        Text('Offline'),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Tasks',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'available':
        return Colors.green;
      case 'busy':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}

class TasksTab extends StatelessWidget {
  const TasksTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const OfflineBanner(),
        Expanded(
          child: Consumer<RiderProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (provider.tasks.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.inbox, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No active tasks',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'New assignments will appear here',
                        style: TextStyle(color: Colors.grey[500]),
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () => provider.loadTasks(),
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: provider.tasks.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      // KPI Summary Card
                      final active = provider.tasks.where((t) => t.isAccepted).length;
                      final onRoute = provider.tasks.where((t) => t.isOnWay).length;
                      final arrived = provider.tasks.where((t) => t.isArrived).length;
                      final collected = provider.tasks.where((t) => t.isCollected).length;
                      return Padding(
                        padding: const EdgeInsets.only(top: 16, bottom: 8),
                        child: Card(
                          color: Colors.blue[700],
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Today\'s Overview',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    _KpiChip(label: 'Accepted', value: active, color: Colors.greenAccent),
                                    _KpiChip(label: 'On Route', value: onRoute, color: Colors.lightBlueAccent),
                                    _KpiChip(label: 'Arrived', value: arrived, color: Colors.orangeAccent),
                                    _KpiChip(label: 'Collected', value: collected, color: Colors.purpleAccent[100]!),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }
                    final task = provider.tasks[index - 1];
                    return TaskCard(task: task);
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _KpiChip extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _KpiChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$value',
          style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
      ],
    );
  }
}

class TaskCard extends StatelessWidget {
  final Task task;

  const TaskCard({super.key, required this.task});

  @override
  Widget build(BuildContext context) {
    final urgencyColor = _urgencyBorderColor(task.slaUrgency);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: urgencyColor.withOpacity(0.5), width: 1.5),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => TaskDetailScreen(task: task),
            ),
          );
        },
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Urgency accent bar on the left
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: urgencyColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Task #${task.id}',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          _buildStatusChip(task.statusDisplay),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(Icons.person, size: 15, color: Colors.grey),
                          const SizedBox(width: 6),
                          Text(task.patientName ?? 'Unknown Patient', style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 15, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              task.address,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.science, size: 15, color: Colors.grey),
                          const SizedBox(width: 6),
                          Text(task.testName ?? 'Test', style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                      // SLA urgency badge
                      SlaBadge(task: task, compact: true),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _urgencyBorderColor(SlaUrgency urgency) {
    switch (urgency) {
      case SlaUrgency.breached:
        return Colors.red;
      case SlaUrgency.warning:
        return Colors.orange;
      case SlaUrgency.ok:
        return Colors.green[300]!;
    }
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status) {
      case 'Accepted':
        color = Colors.green;
        break;
      case 'On the Way':
        color = Colors.blue;
        break;
      case 'Arrived':
        color = Colors.orange;
        break;
      case 'Sample Collected':
        color = Colors.purple;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
