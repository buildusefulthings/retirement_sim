import numpy as np

# Core simulation function
def simulation(balance, apy, draw, duration, curr_exp, tax_rate, inflation, annual_contrib, 
               annual_contrib_years=0, drawdown_start=0):
    princ, salary, real_income, spend, label, surplus, status = [], [], [], [], [], [], []
    for year in range(duration):
        if year > 0:
            curr_exp *= (1 + inflation)
        spend.append(round(curr_exp, 2))
        balance *= (1 + apy)
        contrib = annual_contrib if year < annual_contrib_years else 0
        balance += contrib
        balance -= curr_exp
        princ.append(round(balance, 2))
    for year in range(duration):
        inc = princ[year] * draw if year >= drawdown_start else 0
        salary.append(round(inc, 2))
    for inc in salary:
        net = inc * (1 - tax_rate)
        real_income.append(round(net, 2))
    for i in range(duration):
        yr_label = f'Year-{i + 1}'
        label.append(yr_label)
        sur = real_income[i] - spend[i]
        surplus.append(round(sur, 2))
        note = 'Retire' if sur >= 0 else 'Keep Working'
        status.append(note)
    combined = {
        f'Year-{i + 1}': {
            'principal': princ[i],
            'income': salary[i],
            'real_income cap': real_income[i],
            'projected_spend': spend[i],
            'surplus': surplus[i],
            'status': status[i]
        }
        for i in range(duration)
    }
    return combined

def monte_carlo_retirement(
    balance, draw, duration, curr_exp, tax_rate, 
    apy_mean, apy_sd, inflation_mean, inflation_sd, 
    annual_contrib, annual_contrib_years, drawdown_start,
    simulations=1000):
    success_matrix = []
    for _ in range(simulations):
        apy = np.random.normal(apy_mean, apy_sd)
        inflation = np.random.normal(inflation_mean, inflation_sd)
        result = simulation(balance, apy, draw, duration, curr_exp, tax_rate, inflation, 
                            annual_contrib, annual_contrib_years, drawdown_start)
        yearly_success = [result[f'Year-{i+1}']['surplus'] >= 0 for i in range(duration)]
        success_matrix.append(yearly_success)
    success_matrix = np.array(success_matrix)
    success_rates = success_matrix.mean(axis=0)
    return success_rates

def find_optimal_retirement_year(
    balance, draw, duration, curr_exp, tax_rate, 
    apy_mean, apy_sd, inflation_mean, inflation_sd, 
    annual_contrib, annual_contrib_years, drawdown_start,
    simulations=1000, target_success_rate=0.90):
    success_rates = monte_carlo_retirement(
        balance, draw, duration, curr_exp, tax_rate, 
        apy_mean, apy_sd, inflation_mean, inflation_sd, 
        annual_contrib, annual_contrib_years, drawdown_start,
        simulations)
    for i, rate in enumerate(success_rates):
        if rate >= target_success_rate:
            return f"Year-{i+1}", rate
    return f"Year-{duration}", success_rates[-1]
