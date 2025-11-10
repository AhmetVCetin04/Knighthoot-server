echo "Running API Unit Tests"
echo "=============================="

declare -A results

export NODE_ENV=test

for collection in *.postman_collection.json; do
    echo "Running test: $collection"

    # capture newman output
    output=$(newman run "$collection" --reporters cli 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo "Pass: $collection"
        results["$collection"]="PASS"
    else
        echo "Fail: $collection"
        results["$collection"]="FAIL"
        echo "Failure details:"
        echo "$output"
    fi

    echo "-----------------------"
done

echo "Test summary"
for test in "${!results[@]}"; do
    printf "%-40s %s\n" "$test" "${results[$test]}"
done

echo "Finished running all tests"
echo "============================"

