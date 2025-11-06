// File: lib/screens/grades_screen.dart
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/test_score.dart';
import '../services/api_service.dart';

enum SortBy { name, score, date }

class GradesScreen extends StatefulWidget {
  final User user;

  const GradesScreen({Key? key, required this.user}) : super(key: key);

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  List<TestScore> _allScores = [];
  List<TestScore> _filteredScores = [];
  bool _isLoading = true;
  String _searchQuery = '';
  SortBy _currentSort = SortBy.date;
  bool _isAscending = false; // false = descending (newest/highest first)

  @override
  void initState() {
    super.initState();
    _loadScores();
  }

  Future<void> _loadScores() async {
    setState(() => _isLoading = true);

    try {
      final scores = await ApiService.getStudentScores(
        widget.user.id,
        widget.user.token ?? '',
      );

      setState(() {
        _allScores = scores;
        _filteredScores = List.from(scores);
        _applySorting();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query.toLowerCase();
      if (_searchQuery.isEmpty) {
        _filteredScores = List.from(_allScores);
      } else {
        _filteredScores = _allScores
            .where((score) =>
                score.testName.toLowerCase().contains(_searchQuery))
            .toList();
      }
      _applySorting();
    });
  }

  void _changeSortBy(SortBy sortBy) {
    setState(() {
      if (_currentSort == sortBy) {
        // Toggle ascending/descending
        _isAscending = !_isAscending;
      } else {
        _currentSort = sortBy;
        _isAscending = false; // Default to descending for new sort
      }
      _applySorting();
    });
  }

  void _applySorting() {
    switch (_currentSort) {
      case SortBy.name:
        _filteredScores.sort((a, b) => _isAscending
            ? a.testName.compareTo(b.testName)
            : b.testName.compareTo(a.testName));
        break;
      case SortBy.score:
        _filteredScores.sort((a, b) {
          final aPercent = (a.score / a.totalQuestions * 100);
          final bPercent = (b.score / b.totalQuestions * 100);
          return _isAscending
              ? aPercent.compareTo(bPercent)
              : bPercent.compareTo(aPercent);
        });
        break;
      case SortBy.date:
        _filteredScores.sort((a, b) => _isAscending
            ? a.dateTaken.compareTo(b.dateTaken)
            : b.dateTaken.compareTo(a.dateTaken));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF171717),
      appBar: AppBar(
        backgroundColor: const Color(0xFF272727),
        elevation: 0,
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'Knighthoot',
          style: TextStyle(
            color: Color(0xFFFFC904),
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Color(0xFFFFC904)),
            onPressed: () {
              // Search icon - could toggle search bar visibility
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF171717),
            child: TextField(
              onChanged: _onSearchChanged,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search tests...',
                hintStyle: const TextStyle(color: Colors.white38),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: const Color(0xFF2A2A2A),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),

          // Sort Options
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFF171717),
            child: Row(
              children: [
                const Text(
                  'Sort by:',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 12),
                _buildSortButton('Name', SortBy.name),
                const SizedBox(width: 8),
                _buildSortButton('Score', SortBy.score),
                const SizedBox(width: 8),
                _buildSortButton('Date', SortBy.date),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFF333333)),

          // Scores List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFFFFC904),
                    ),
                  )
                : _filteredScores.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _searchQuery.isEmpty
                                  ? Icons.assignment_outlined
                                  : Icons.search_off,
                              size: 64,
                              color: Colors.white24,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _searchQuery.isEmpty
                                  ? 'No tests taken yet'
                                  : 'No tests found',
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: const Color(0xFFFFC904),
                        onRefresh: _loadScores,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredScores.length,
                          itemBuilder: (context, index) {
                            final score = _filteredScores[index];
                            return _buildScoreCard(score);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortButton(String label, SortBy sortBy) {
    final isActive = _currentSort == sortBy;
    return InkWell(
      onTap: () => _changeSortBy(sortBy),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFFFC904) : const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.black : Colors.white70,
                fontSize: 12,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (isActive) ...[
              const SizedBox(width: 4),
              Icon(
                _isAscending ? Icons.arrow_upward : Icons.arrow_downward,
                size: 12,
                color: Colors.black,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildScoreCard(TestScore score) {
    final percentage = (score.score / score.totalQuestions * 100).round();
    final color = _getScoreColor(percentage);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(0xFF333333),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Student Name
                Text(
                  '${score.studentFirstName} ${score.studentLastName}',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),

                // Test Name
                Text(
                  score.testName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),

                // Date
                Text(
                  'Taken ${_formatDate(score.dateTaken)}',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

          // Score Display
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: color, width: 1),
            ),
            child: Column(
              children: [
                Text(
                  'Score:',
                  style: TextStyle(
                    color: color,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${score.score}/${score.totalQuestions}',
                  style: TextStyle(
                    color: color,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(int percentage) {
    if (percentage >= 90) return Colors.green;
    if (percentage >= 70) return const Color(0xFFFFC904);
    if (percentage >= 50) return Colors.orange;
    return Colors.red;
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day}/${date.month}/${date.year}';
  }
}