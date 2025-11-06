// File: lib/models/test_score.dart
class TestScore {
  final String id;
  final String testName;
  final String studentFirstName;
  final String studentLastName;
  final int score;
  final int totalQuestions;
  final DateTime dateTaken;

  TestScore({
    required this.id,
    required this.testName,
    required this.studentFirstName,
    required this.studentLastName,
    required this.score,
    required this.totalQuestions,
    required this.dateTaken,
  });

  factory TestScore.fromJson(Map<String, dynamic> json) {
    return TestScore(
      id: json['_id'] ?? json['id'] ?? '',
      testName: json['testName'] ?? 'Unknown Test',
      studentFirstName: json['studentFirstName'] ?? '',
      studentLastName: json['studentLastName'] ?? '',
      score: json['score'] ?? 0,
      totalQuestions: json['totalQuestions'] ?? 0,
      dateTaken: json['dateTaken'] != null
          ? DateTime.parse(json['dateTaken'])
          : DateTime.now(),
    );
  }

  double get percentage => totalQuestions > 0 ? (score / totalQuestions * 100) : 0.0;
}