#!/usr/bin/env python3
"""
LLM Evaluation Suite - Golden Dataset Testing

This script runs systematic evaluations of LLM outputs against a Golden Dataset
to prevent regressions and ensure quality remains high.

Usage:
    python execution/run_evals.py

Environment Variables:
    OPENAI_API_KEY or ANTHROPIC_API_KEY - API keys for testing
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple


class EvalResult:
    """Single evaluation result"""
    def __init__(self, test_name: str, passed: bool, expected: str, actual: str, score: float = 0.0):
        self.test_name = test_name
        self.passed = passed
        self.expected = expected
        self.actual = actual
        self.score = score


class EvalSuite:
    """LLM Evaluation Suite using Golden Dataset"""
    
    def __init__(self, golden_dataset_path: str = "tests/evals/golden_dataset.json"):
        self.golden_dataset_path = Path(golden_dataset_path)
        self.results: List[EvalResult] = []
    
    def load_golden_dataset(self) -> List[Dict]:
        """Load Golden Dataset from JSON file"""
        if not self.golden_dataset_path.exists():
            print(f"⚠️  Golden Dataset not found at: {self.golden_dataset_path}")
            print("   Skipping evals. Create golden_dataset.json to enable.")
            return []
        
        with open(self.golden_dataset_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def run_test(self, test_case: Dict) -> EvalResult:
        """
        Run a single test case

        Test case format:
        {
            "id": "test_001",
            "name": "Descriptive test name",
            "input": { ... },
            "expected_output": {
                "exact": {"key": "expected_value"},
                "contains": ["substring1", "substring2"],
                "type": {"key": "str"}
            }
        }
        """
        test_name = test_case.get('name', test_case.get('id', 'unknown'))
        
        try:
            # TODO: Replace this with your actual function call
            # Example: actual_output = your_alert_function(test_case['input'])
            
            # For now, this is a placeholder
            actual_output = self._mock_function(test_case['input'])
            
            # Validate output against expected
            passed = self._validate_output(actual_output, test_case['expected_output'])
            
            return EvalResult(
                test_name=test_name,
                passed=passed,
                expected=str(test_case['expected_output']),
                actual=str(actual_output),
                score=1.0 if passed else 0.0
            )
        
        except Exception as e:
            print(f"❌ Error running test '{test_name}': {e}")
            return EvalResult(
                test_name=test_name,
                passed=False,
                expected=str(test_case.get('expected_output', '')),
                actual=f"ERROR: {str(e)}",
                score=0.0
            )
    
    def _mock_function(self, input_data: Dict) -> Dict:
        """
        TODO: Replace this with your actual function

        This is a placeholder that returns mock data for template demonstration.
        """
        return {
            "status": "processed",
            "input_keys": list(input_data.keys()),
            "message": "Mock response - replace _mock_function with your actual logic"
        }
    
    def _validate_output(self, actual: Dict, expected: Dict) -> bool:
        """
        Validate actual output matches expected criteria
        
        Supports multiple validation types:
        - exact: Exact match
        - contains: String contains check
        - type: Type matching
        """
        # Check exact fields
        if 'exact' in expected:
            for key, value in expected['exact'].items():
                if actual.get(key) != value:
                    return False
        
        # Check contains (for string fields)
        if 'contains' in expected:
            actual_str = str(actual)
            for substring in expected['contains']:
                if substring not in actual_str:
                    return False
        
        # Check types (safe mapping, no eval)
        SAFE_TYPE_MAP = {"str": str, "int": int, "float": float, "dict": dict, "list": list, "bool": bool}
        if 'type' in expected:
            for key, expected_type in expected['type'].items():
                if expected_type not in SAFE_TYPE_MAP:
                    raise ValueError(f"Unsupported type '{expected_type}'. Allowed: {list(SAFE_TYPE_MAP.keys())}")
                if not isinstance(actual.get(key), SAFE_TYPE_MAP[expected_type]):
                    return False
        
        return True
    
    def run_all(self) -> Tuple[int, int, float]:
        """
        Run all tests in Golden Dataset
        
        Returns:
            (passed, total, quality_score)
        """
        dataset = self.load_golden_dataset()
        
        if not dataset:
            return (0, 0, 0.0)
        
        print("\n" + "="*60)
        print("🎯 Running LLM Evaluation Suite")
        print("="*60 + "\n")
        
        for test_case in dataset:
            result = self.run_test(test_case)
            self.results.append(result)
            
            status = "✅ PASS" if result.passed else "❌ FAIL"
            print(f"{status} - {result.test_name}")
            
            if not result.passed:
                print(f"  Expected: {result.expected}")
                print(f"  Actual:   {result.actual}")
                print()
        
        # Calculate quality score
        passed = sum(1 for r in self.results if r.passed)
        total = len(self.results)
        quality_score = (passed / total * 100) if total > 0 else 0.0
        
        return (passed, total, quality_score)
    
    def print_summary(self, passed: int, total: int, quality_score: float):
        """Print evaluation summary"""
        print("\n" + "="*60)
        print("📊 Evaluation Summary")
        print("="*60)
        print(f"Tests passed: {passed}/{total}")
        print(f"Quality Score: {quality_score:.1f}%")
        
        if quality_score >= 85:
            print("✅ Quality threshold met (≥85%)")
        else:
            print("⚠️  Quality threshold NOT met (<85%)")
        
        print("="*60 + "\n")


def main():
    """Main entry point"""
    suite = EvalSuite()
    passed, total, quality_score = suite.run_all()
    suite.print_summary(passed, total, quality_score)
    
    # Exit with error code if quality is below threshold
    if total > 0 and quality_score < 85.0:
        print("❌ Quality gate failed. Fix issues before merging.")
        sys.exit(1)
    
    if total == 0:
        print("⚠️  No tests found. Create tests/evals/golden_dataset.json")
        sys.exit(0)
    
    print("✅ All evals passed!")
    sys.exit(0)


if __name__ == "__main__":
    main()
