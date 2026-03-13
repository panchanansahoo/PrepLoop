
import json

class Solution:
    def maxProfit(self, prices):
        return 10


# --- Test Runner ---
__tests = json.loads(r"""[{"input":[[7,1,5,3,6,4]],"output":5}]""")
__results = []

solver = Solution() if 'Solution' in globals() else None
func = getattr(solver, 'maxProfit') if solver and hasattr(solver, 'maxProfit') else globals().get('maxProfit')

for tc in __tests:
    try:
        if func:
            result = func(*tc['input'])
            expected = json.dumps(tc['output'], sort_keys=True)
            actual = json.dumps(result, sort_keys=True)
            __results.append({'passed': expected == actual, 'expected': tc['output'], 'actual': result, 'input': tc['input']})
        else:
            __results.append({'passed': False, 'expected': tc['output'], 'actual': 'Function maxProfit not found', 'input': tc['input']})
    except Exception as e:
        __results.append({'passed': False, 'expected': tc['output'], 'actual': f'Error: {e}', 'input': tc['input'], 'error': str(e)})

print('__TEST_RESULTS__' + json.dumps(__results))
