import { render } from '@testing-library/react-native';
import ChallengeBox from './ChallengeBox';

const mockChallenge = {
    name: 'Berling Run',
    startOrt: 'Berlin',
    zielOrt: 'Potsdam',
    fortschrittKm: 5,
    streckenlaenge: 10,
};

test('renders challenge info correctly', () => {
    const { getByText, getByTestId } = render(
        <ChallengeBox challenge={mockChallenge} />
    );

    const bar = getByTestId('progress-bar');

    expect(bar.props.style).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ width: '50%' }),
        ])
    );
    expect(getByText('Berling Run')).toBeTruthy();
    expect(getByText('Berlin → Potsdam')).toBeTruthy();
    expect(getByText('5 / 10 km')).toBeTruthy();
});