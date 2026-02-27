
enum SlaUrgency { ok, warning, breached }

class Task {
  final int id;
  final int userId;
  final int testId;
  final String appointmentDate;
  final String status;
  final String address;
  final String? patientName;
  final String? patientPhone;
  final String? testName;
  final String? samplePhoto;
  final String? collectionNotes;
  final double? collectionLatitude;
  final double? collectionLongitude;
  final double? patientLatitude;
  final double? patientLongitude;
  final String? riderAssignedAt;
  final String? riderAcceptedAt;
  final String? sampleCollectedAt;
  final String? deliveredAt;
  // SLA fields
  final DateTime? pickupDeadline;
  final DateTime? deliveryDeadline;
  final String priorityLevel;

  Task({
    required this.id,
    required this.userId,
    required this.testId,
    required this.appointmentDate,
    required this.status,
    required this.address,
    this.patientName,
    this.patientPhone,
    this.testName,
    this.samplePhoto,
    this.collectionNotes,
    this.collectionLatitude,
    this.collectionLongitude,
    this.patientLatitude,
    this.patientLongitude,
    this.riderAssignedAt,
    this.riderAcceptedAt,
    this.sampleCollectedAt,
    this.deliveredAt,
    this.pickupDeadline,
    this.deliveryDeadline,
    this.priorityLevel = 'normal',
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'],
      userId: json['user_id'],
      testId: json['test_id'],
      appointmentDate: json['date'], // Backend returns 'date', not 'appointment_date'
      status: json['status'],
      address: json['address'],
      patientName: json['patient_name'],
      patientPhone: json['patient_phone'],
      testName: json['test_name'],
      samplePhoto: json['sample_photo'],
      collectionNotes: json['collection_notes'],
      collectionLatitude: json['collection_latitude']?.toDouble(),
      collectionLongitude: json['collection_longitude']?.toDouble(),
      patientLatitude: json['patient_latitude']?.toDouble(),
      patientLongitude: json['patient_longitude']?.toDouble(),
      riderAssignedAt: json['rider_assigned_at'],
      riderAcceptedAt: json['rider_accepted_at'],
      sampleCollectedAt: json['sample_collected_at'],
      deliveredAt: json['delivered_at'],
      pickupDeadline: json['pickup_deadline'] != null ? DateTime.parse(json['pickup_deadline']) : null,
      deliveryDeadline: json['delivery_deadline'] != null ? DateTime.parse(json['delivery_deadline']) : null,
      priorityLevel: json['priority_level'] ?? 'normal',
    );
  }

  bool get isAccepted => status == 'rider_accepted';
  bool get isOnWay => status == 'rider_on_way';
  bool get isArrived => status == 'rider_arrived';
  bool get isCollected => status == 'sample_collected';
  bool get isDelivered => status == 'delivered_to_lab';

  String get statusDisplay {
    switch (status) {
      case 'rider_accepted':
        return 'Accepted';
      case 'rider_on_way':
        return 'On the Way';
      case 'rider_arrived':
        return 'Arrived';
      case 'sample_collected':
        return 'Sample Collected';
      case 'delivered_to_lab':
        return 'Delivered';
      default:
        return status;
    }
  }

  /// Deadline relevant to the current status stage.
  DateTime? get _relevantDeadline {
    if (isAccepted || isOnWay || isArrived) return pickupDeadline;
    if (isCollected) return deliveryDeadline;
    return null;
  }

  /// Minutes remaining until the relevant deadline (negative = overdue).
  int? get minutesToDeadline {
    final d = _relevantDeadline;
    if (d == null) return null;
    return d.difference(DateTime.now().toUtc()).inMinutes;
  }

  /// SLA urgency level based on time remaining.
  SlaUrgency get slaUrgency {
    final mins = minutesToDeadline;
    if (mins == null) return SlaUrgency.ok;
    if (mins < 0) return SlaUrgency.breached;
    if (mins < 30) return SlaUrgency.warning;
    return SlaUrgency.ok;
  }

  /// Sort key: breached + critical tasks first, then nearest deadline.
  int get sortKey {
    final pWeight = priorityLevel == 'critical' ? 0 : priorityLevel == 'urgent' ? 1 : 2;
    final mins = minutesToDeadline ?? 9999;
    return pWeight * 100000 + (mins + 10000);
  }
}
