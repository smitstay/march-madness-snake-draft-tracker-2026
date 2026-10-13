import unittest
import numpy as np
from model import advancement, bracket_order, fit_model, matrix, srs, slot_for_pick

class ModelTest(unittest.TestCase):
    def test_probability_symmetry_and_total_points(self):
        coef = fit_model([[1, 2], [-1, -2], [.2, 1], [-.5, -1]], [1, 0, 1, 0], True)
        p = matrix(list(range(64)), {t: t % 16 + 1 for t in range(64)}, {t: float(t) for t in range(64)}, coef)
        np.testing.assert_allclose(p + p.T, 1)
        np.testing.assert_allclose(advancement(p).sum(axis=0), [32, 16, 8, 4, 2, 1])
        self.assertAlmostEqual(float(advancement(p).sum()), 63)

    def test_srs_uses_opposition_and_home_court(self):
        games = [{'WTeamID': '1', 'LTeamID': '2', 'WScore': '80', 'LScore': '60', 'WLoc': 'N'},
                 {'WTeamID': '2', 'LTeamID': '3', 'WScore': '80', 'LScore': '60', 'WLoc': 'N'}]
        r = srs(games)
        self.assertGreater(r[1], r[2]); self.assertGreater(r[2], r[3])

    def test_unresolved_play_in_fails(self):
        with self.assertRaisesRegex(ValueError, 'unresolved'):
            bracket_order([{'Seed': 'W16a','TeamID':'1'}, {'Seed':'W16b','TeamID':'2'}],
                          [{'Slot':'W16','StrongSeed':'W16a','WeakSeed':'W16b'}], [])

    def test_snake(self):
        self.assertEqual([slot_for_pick(i) for i in range(8,16)], list(reversed(range(8))))

if __name__ == '__main__': unittest.main()
