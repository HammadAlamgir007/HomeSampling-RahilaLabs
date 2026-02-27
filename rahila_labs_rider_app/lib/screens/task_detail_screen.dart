import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../providers/rider_provider.dart';
import '../models/task.dart';
import '../widgets/sla_badge.dart';

class TaskDetailScreen extends StatefulWidget {
  final Task task;

  const TaskDetailScreen({super.key, required this.task});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final _notesController = TextEditingController();
  XFile? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  // Minimum required photo dimensions for sample compliance (Phase 7)
  static const int _minPhotoWidth = 640;
  static const int _minPhotoHeight = 480;

  Future<void> _pickImage() async {
    try {
      // Use camera on mobile, gallery on web (camera API not well supported in browser)
      final source = kIsWeb ? ImageSource.gallery : ImageSource.camera;

      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 90,   // Light compression to keep quality
        preferredCameraDevice: CameraDevice.rear,
      );

      if (image == null || !mounted) return;

      // ── Minimum resolution check (Phase 7.4) ───────────────────────────────
      final bytes = await image.readAsBytes();
      final decoded = await decodeImageFromList(bytes);
      if (decoded.width < _minPhotoWidth || decoded.height < _minPhotoHeight) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Photo resolution too low (${decoded.width}×${decoded.height}). '
                'Minimum required: ${_minPhotoWidth}×${_minPhotoHeight}. '
                'Please retake with a better camera or different angle.',
              ),
              backgroundColor: Colors.red[700],
              duration: const Duration(seconds: 5),
            ),
          );
        }
        return; // Reject the photo
      }

      setState(() {
        _selectedImage = image;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Photo captured ✓ (${decoded.width}×${decoded.height})'),
            backgroundColor: Colors.green[700],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error capturing photo: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _makePhoneCall(String phone) async {
    final Uri url = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  /// Opens navigation to patient location.
  /// Uses precise GPS coordinates if available, falls back to address text search.
  Future<void> _openInMaps() async {
    final task = widget.task;
    Uri mapsUrl;

    if (task.patientLatitude != null && task.patientLongitude != null) {
      // Precise GPS navigation
      final lat = task.patientLatitude!;
      final lng = task.patientLongitude!;
      final label = Uri.encodeComponent(task.patientName ?? 'Patient');
      // Works on Android (Google Maps) and iOS (Apple Maps via geo:)
      mapsUrl = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving');
    } else {
      // Address-based search fallback
      final query = Uri.encodeComponent(task.address);
      mapsUrl = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    }

    if (await canLaunchUrl(mapsUrl)) {
      await launchUrl(mapsUrl, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Maps. Install Google Maps or check your browser.')),
      );
    }
  }

  Future<void> _handleMarkOnWay() async {
    final provider = Provider.of<RiderProvider>(context, listen: false);

    // Check if another task is already on-way — warn rider before switching
    final currentOnWay = provider.activeOnWayTask;
    if (currentOnWay != null && currentOnWay.id != widget.task.id) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.swap_horiz, color: Colors.orange),
              SizedBox(width: 8),
              Text('Switch Active Task?'),
            ],
          ),
          content: Text(
            'You are currently on the way to Task #${currentOnWay.id} '
            '(${currentOnWay.patientName}).\n\n'
            'Switching will revert that task to Accepted status.\n'
            'Continue to Task #${widget.task.id}?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              child: const Text('Switch', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirmed != true || !mounted) return;
    }

    final success = await provider.markOnWay(widget.task.id);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status updated to On the Way')),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _handleArrived() async {
    final provider = Provider.of<RiderProvider>(context, listen: false);
    final success = await provider.markArrived(widget.task.id);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Marked as Arrived at patient location')),
      );
      Navigator.pop(context);
    } else if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Failed to mark arrived'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Minimum notes length in characters for compliance
  static const int _minNotesLength = 10;

  Future<void> _handleCollectSample() async {
    // Phase 7.2 — Enforce photo upload
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.camera_alt, color: Colors.white),
              SizedBox(width: 8),
              Text('Photo of sample is required before collection'),
            ],
          ),
          backgroundColor: Colors.red[700],
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    // Phase 7.3 — Enforce non-empty notes (minimum length)
    final notes = _notesController.text.trim();
    if (notes.length < _minNotesLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Collection notes must be at least $_minNotesLength characters '
            '(currently ${notes.length}).',
          ),
          backgroundColor: Colors.orange[800],
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    final provider = Provider.of<RiderProvider>(context, listen: false);
    final success = await provider.collectSample(
      taskId: widget.task.id,
      photo: _selectedImage!,
      notes: notes,
    );
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sample collected & compliance data recorded ✓'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Failed to collect sample.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _handleDeliverSample() async {
    final provider = Provider.of<RiderProvider>(context, listen: false);
    final success = await provider.deliverSample(widget.task.id);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sample delivered to lab')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text('Task #${widget.task.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.blue.shade200),
              ),
              color: Colors.blue[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      widget.task.statusDisplay,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SlaBadge(task: widget.task),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Patient Info
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.person_outline, color: Colors.blue[800]),
                        const SizedBox(width: 8),
                        const Text(
                          'Patient Information',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    ListTile(
                      leading: const Icon(Icons.person),
                      title: Text(widget.task.patientName ?? 'Unknown'),
                      contentPadding: EdgeInsets.zero,
                    ),
                    ListTile(
                      leading: const Icon(Icons.phone),
                      title: Text(widget.task.patientPhone ?? 'N/A'),
                      trailing: widget.task.patientPhone != null
                          ? IconButton(
                              icon: const Icon(Icons.call),
                              onPressed: () => _makePhoneCall(widget.task.patientPhone!),
                            )
                          : null,
                      contentPadding: EdgeInsets.zero,
                    ),
                    ListTile(
                      leading: const Icon(Icons.location_on, color: Colors.red),
                      title: Text(widget.task.address),
                      subtitle: widget.task.patientLatitude != null
                          ? Text(
                              'GPS: ${widget.task.patientLatitude!.toStringAsFixed(4)}, ${widget.task.patientLongitude!.toStringAsFixed(4)}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            )
                          : null,
                      trailing: ElevatedButton.icon(
                        onPressed: _openInMaps,
                        icon: const Icon(Icons.navigation, size: 16),
                        label: const Text('Navigate', style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.teal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                      ),
                      contentPadding: EdgeInsets.zero,
                    ),
                    ListTile(
                      leading: const Icon(Icons.science),
                      title: Text(widget.task.testName ?? 'Test'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Sample Collection (for on-way status)
            if (widget.task.isOnWay) ...[
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header + compliance checklist
                      Row(
                        children: [
                          const Icon(Icons.science, color: Colors.purple),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'Sample Collection',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          // Compliance status pills
                          _CompliancePill(
                            label: 'Photo',
                            ok: _selectedImage != null,
                          ),
                          const SizedBox(width: 6),
                          _CompliancePill(
                            label: 'Notes',
                            ok: _notesController.text.trim().length >= _minNotesLength,
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Min. ${_minPhotoWidth}×${_minPhotoHeight}px photo + ${_minNotesLength}+ char notes required',
                        style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                      ),
                      const Divider(height: 24),

                      // Photo preview
                      if (_selectedImage != null)
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                _selectedImage!.path,
                                height: 180,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (ctx, err, _) => Container(
                                  height: 180,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[300],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Center(child: Text('Preview unavailable on this platform')),
                                ),
                              ),
                            ),
                            Positioned(
                              top: 8, right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green[700],
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.check_circle, color: Colors.white, size: 14),
                                    SizedBox(width: 4),
                                    Text('Photo OK', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                      else
                        InkWell(
                          onTap: _pickImage,
                          child: Container(
                            height: 120,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.red[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.red.shade300, style: BorderStyle.solid),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(kIsWeb ? Icons.photo_library : Icons.camera_alt,
                                    size: 36, color: Colors.red[400]),
                                const SizedBox(height: 6),
                                Text(
                                  kIsWeb ? 'Tap to select photo (required)' : 'Tap to take photo (required)',
                                  style: TextStyle(color: Colors.red[600], fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),

                      // Camera / Gallery button
                      ElevatedButton.icon(
                        onPressed: _pickImage,
                        icon: Icon(kIsWeb ? Icons.photo_library : Icons.camera_alt, size: 18),
                        label: Text(kIsWeb ? 'Select from Gallery' : 'Take Photo with Camera',
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _selectedImage != null ? Colors.green[700] : Colors.blue[700],
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 46),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Notes field with character counter
                      StatefulBuilder(
                        builder: (_, setInner) {
                          final len = _notesController.text.trim().length;
                          final enough = len >= _minNotesLength;
                          return TextField(
                            controller: _notesController,
                            onChanged: (_) => setInner(() {}),
                            decoration: InputDecoration(
                              labelText: 'Collection Notes *',
                              hintText: 'Describe sample condition, tube type, any anomalies...',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey[50],
                              counterText: '$len / min $_minNotesLength chars',
                              counterStyle: TextStyle(
                                color: enough ? Colors.green[700] : Colors.red[700],
                                fontWeight: FontWeight.w600,
                              ),
                              suffixIcon: enough
                                  ? const Icon(Icons.check_circle, color: Colors.green)
                                  : const Icon(Icons.warning, color: Colors.orange),
                            ),
                            maxLines: 3,
                            maxLength: 500,
                            buildCounter: (ctx, {required currentLength, required isFocused, maxLength}) {
                              return Text(
                                '$currentLength / min $_minNotesLength chars',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: currentLength >= _minNotesLength ? Colors.green[700] : Colors.red[700],
                                  fontWeight: FontWeight.w600,
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Action Buttons — start from Accepted state
            const SizedBox(height: 8),
            if (widget.task.isAccepted)
              ElevatedButton(
                onPressed: _handleMarkOnWay,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('Mark as On the Way', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),

            if (widget.task.isOnWay) ...[
              ElevatedButton(
                onPressed: _handleArrived,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange[700],
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.location_on, size: 20),
                    SizedBox(width: 8),
                    Text('Mark Arrived at Location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Collect sample available from both rider_on_way and rider_arrived
            if (widget.task.isOnWay || widget.task.isArrived)
              ElevatedButton(
                onPressed: _handleCollectSample,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.purple[600],
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('Mark Sample Collected', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),

            if (widget.task.isCollected)
              ElevatedButton(
                onPressed: _handleDeliverSample,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal[600],
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('Mark Delivered to Lab', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

/// Small compliance status pill used in sample collection card header.
class _CompliancePill extends StatelessWidget {
  final String label;
  final bool ok;

  const _CompliancePill({required this.label, required this.ok});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: ok ? Colors.green[100] : Colors.red[100],
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: ok ? Colors.green : Colors.red, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(ok ? Icons.check_circle : Icons.cancel,
              size: 12, color: ok ? Colors.green[700] : Colors.red[700]),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: ok ? Colors.green[800] : Colors.red[800],
            ),
          ),
        ],
      ),
    );
  }
}
