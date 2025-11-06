// File: lib/screens/grades_screen.dart
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/test_score.dart';
import '../services/api_service.dart';
import 'join_quiz_screen.dart';

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
  bool _isAscending = false;
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadScores();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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

  void _toggleSearch() {
    setState(() {
      _isSearching = !_isSearching;
      if (!_isSearching) {
        _searchController.clear();
        _onSearchChanged('');
      }
    });
  }

  void _showSortDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF272727),
          title: const Text(
            'Sort by',
            style: TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildSortOption('Name', SortBy.name),
              _buildSortOption('Score', SortBy.score),
              _buildSortOption('Date', SortBy.date),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSortOption(String label, SortBy sortBy) {
    final isActive = _currentSort == sortBy;
    return ListTile(
      title: Text(
        label,
        style: TextStyle(
          color: isActive ? const Color(0xFFFFC904) : Colors.white,
          fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: isActive
          ? Icon(
              _isAscending ? Icons.arrow_upward : Icons.arrow_downward,
              color: const Color(0xFFFFC904),
            )
          : null,
      onTap: () {
        setState(() {
          if (_currentSort == sortBy) {
            _isAscending = !_isAscending;
          } else {
            _currentSort = sortBy;
            _isAscending = false;
          }
          _applySorting();
        });
        Navigator.pop(context);
      },
    );
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
        leading: IconButton(
          icon: const Icon(Icons.sort, color: Color(0xFFFFC904)),
          onPressed: _showSortDialog,
        ),
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Search tests...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                ),
                onChanged: _onSearchChanged,
              )
            : const Text(
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
            icon: Icon(
              _isSearching ? Icons.close : Icons.search,
              color: const Color(0xFFFFC904),
            ),
            onPressed: () {
              if (mounted) {
                setState(() {
                  _isSearching = !_isSearching;
                  if (!_isSearching) {
                    _searchController.clear();
                    _onSearchChanged('');
                  }
                });
              }
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // Background decorative squares
          Positioned(
            top: 50,
            right: 30,
            child: _buildHollowSquare(200, 2),
          ),
          Positioned(
            top: 0,
            left: 0,
            child: _buildHollowSquare(200, 2),
          ),
          Positioned(
            bottom: 200,
            right: 50,
            child: _buildHollowSquare(80, 2),
          ),
          Positioned(
            bottom: 100,
            left: 20,
            child: _buildHollowSquare(50, 2),
          ),
          Positioned(
            top: 300,
            right: 70,
            child: _buildHollowSquare(35, 2),
          ),
          Positioned(
            top: 400,
            left: 60,
            child: _buildHollowSquare(45, 2),
          ),
          Positioned(
            bottom: 200,
            left: 80,
            child: _buildHollowSquare(150, 2),
          ),

          // Main content
          _isLoading
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
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF272727),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          backgroundColor: const Color(0xFF272727),
          selectedItemColor: const Color(0xFFFFC904),
          unselectedItemColor: Colors.white54,
          currentIndex: 1, // Grades tab
          onTap: (index) {
            if (index == 0) {
              // Navigate back to Test tab
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => JoinQuizScreen(user: widget.user),
                ),
              );
            }
          },
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment),
              label: 'Test',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.grade),
              label: 'Grades',
            ),
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

  Widget _buildHollowSquare(double size, double borderWidth) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        border: Border.all(
          color: const Color(0xFF272727),
          width: borderWidth,
        ),
      ),
    );
  }
}