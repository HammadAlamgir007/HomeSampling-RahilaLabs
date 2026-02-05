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
  final String? riderAssignedAt;
  final String? riderAcceptedAt;
  final String? sampleCollectedAt;
  final String? deliveredAt;

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
    this.riderAssignedAt,
    this.riderAcceptedAt,
    this.sampleCollectedAt,
    this.deliveredAt,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'],
      userId: json['user_id'],
      testId: json['test_id'],
      appointmentDate: json['appointment_date'],
      status: json['status'],
      address: json['address'],
      patientName: json['patient_name'],
      patientPhone: json['patient_phone'],
      testName: json['test_name'],
      samplePhoto: json['sample_photo'],
      collectionNotes: json['collection_notes'],
      collectionLatitude: json['collection_latitude']?.toDouble(),
      collectionLongitude: json['collection_longitude']?.toDouble(),
      riderAssignedAt: json['rider_assigned_at'],
      riderAcceptedAt: json['rider_accepted_at'],
      sampleCollectedAt: json['sample_collected_at'],
      deliveredAt: json['delivered_at'],
    );
  }

  bool get isPending => status == 'assigned_to_rider';
  bool get isAccepted => status == 'rider_accepted';
  bool get isOnWay => status == 'rider_on_way';
  bool get isCollected => status == 'sample_collected';
  bool get isDelivered => status == 'delivered_to_lab';
  bool get isRejected => status == 'rider_rejected';

  String get statusDisplay {
    switch (status) {
      case 'assigned_to_rider':
        return 'New Assignment';
      case 'rider_accepted':
        return 'Accepted';
      case 'rider_on_way':
        return 'On the Way';
      case 'sample_collected':
        return 'Sample Collected';
      case 'delivered_to_lab':
        return 'Delivered';
      case 'rider_rejected':
        return 'Rejected';
      default:
        return status;
    }
  }
}
