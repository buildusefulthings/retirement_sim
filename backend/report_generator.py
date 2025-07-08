from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import io
import base64
from datetime import datetime
import numpy as np
import matplotlib.ticker as mticker

class RetirementReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles for the report"""
        # Title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1976d2')
        )
        
        # Section header style
        self.section_style = ParagraphStyle(
            'CustomSection',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#1976d2')
        )
        
        # Subsection style
        self.subsection_style = ParagraphStyle(
            'CustomSubsection',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=12,
            textColor=colors.HexColor('#333333')
        )
        
        # Normal text style
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leading=14
        )
        
        # Highlight style
        self.highlight_style = ParagraphStyle(
            'CustomHighlight',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leading=14,
            textColor=colors.HexColor('#1976d2'),
            fontName='Helvetica-Bold'
        )
    
    def create_retirement_chart(self, results, client_name):
        """
        Generate two separate charts:
        1. Principal growth over years (with y-axis labeled at major millions)
        2. Annual income growth over years (with y-axis labeled at major millions)
        Returns (principal_chart_buffer, income_chart_buffer)
        """
        # DEBUG: Print the keys and a sample value
        print(f"[DEBUG] create_retirement_chart called for {client_name}")
        print(f"[DEBUG] results keys: {list(results.keys())}")
        if results:
            first_key = next(iter(results.keys()))
            print(f"[DEBUG] sample value for {first_key}: {results[first_key]}")
        # Extract years, principal, and income in correct order
        sorted_years = sorted(results.keys(), key=lambda x: int(x.split('-')[1]))
        years = []
        principals = []
        incomes = []
        for year_key in sorted_years:
            data = results[year_key]
            if 'principal' in data and data['principal'] is not None:
                year_num = int(year_key.split('-')[1])
                years.append(year_num)
                principals.append(data['principal'])
                incomes.append(data.get('income', 0))
        if not years:
            return None, None
        # --- Principal Chart ---
        fig1, ax1 = plt.subplots(figsize=(8, 4.5))
        ax1.plot(years, principals, color='#1976d2', linewidth=2, label='Portfolio Balance')
        ax1.fill_between(years, principals, alpha=0.3, color='#1976d2')
        ax1.set_xlabel('Year')
        ax1.set_ylabel('Portfolio Balance ($)')
        ax1.set_title(f'Retirement Portfolio Projection - {client_name}')
        ax1.grid(True, alpha=0.2, linestyle='--')
        ax1.legend(loc='upper left')
        # Label y-axis at major millions
        ax1.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x/1e6:.0f}M" if x >= 1e6 else f"${int(x):,}"))
        # Optionally, set y-ticks at each million
        max_principal = max(principals)
        if max_principal >= 1e6:
            ax1.set_yticks([i*1e6 for i in range(1, int(max_principal//1e6)+2)])
        fig1.tight_layout()
        principal_buffer = io.BytesIO()
        fig1.savefig(principal_buffer, format='png', dpi=300, bbox_inches='tight')
        principal_buffer.seek(0)
        plt.close(fig1)
        # --- Income Chart ---
        fig2, ax2 = plt.subplots(figsize=(8, 4.5))
        ax2.plot(years, incomes, color='#388e3c', linewidth=2, label='Annual Income')
        ax2.fill_between(years, incomes, alpha=0.3, color='#388e3c')
        ax2.set_xlabel('Year')
        ax2.set_ylabel('Annual Income ($)')
        ax2.set_title('Annual Income Projection')
        ax2.grid(True, alpha=0.2, linestyle='--')
        ax2.legend(loc='upper left')
        # Label y-axis at major millions
        ax2.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x/1e6:.0f}M" if x >= 1e6 else f"${int(x):,}"))
        max_income = max(incomes)
        if max_income >= 1e6:
            ax2.set_yticks([i*1e6 for i in range(1, int(max_income//1e6)+2)])
        fig2.tight_layout()
        income_buffer = io.BytesIO()
        fig2.savefig(income_buffer, format='png', dpi=300, bbox_inches='tight')
        income_buffer.seek(0)
        plt.close(fig2)
        return principal_buffer, income_buffer
    
    def create_monte_carlo_chart(self, success_rates, target_rate):
        """Create a Monte Carlo success rate chart"""
        plt.figure(figsize=(10, 6))
        
        years = list(range(1, len(success_rates) + 1))
        
        plt.plot(years, [rate * 100 for rate in success_rates], 'b-', linewidth=2, label='Success Rate')
        plt.axhline(y=target_rate * 100, color='red', linestyle='--', linewidth=2, label=f'Target Rate ({target_rate * 100}%)')
        plt.fill_between(years, [rate * 100 for rate in success_rates], alpha=0.3, color='blue')
        
        plt.xlabel('Year', fontsize=12)
        plt.ylabel('Success Rate (%)', fontsize=12)
        plt.title('Monte Carlo Success Rate Analysis', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)
        plt.legend()
        
        # Save to bytes
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
        img_buffer.seek(0)
        plt.close()
        
        return img_buffer
    
    def format_currency(self, amount):
        """Format currency values"""
        if amount is None:
            return "N/A"
        return f"${amount:,.0f}"
    
    def generate_recommendations(self, results, simulation_type, parameters):
        """Generate recommendations based on simulation results"""
        recommendations = []
        
        if simulation_type == 'basic':
            # Analyze basic simulation results
            first_year = list(results.keys())[0]
            last_year = list(results.keys())[-1]
            
            initial_balance = results[first_year]['principal']
            final_balance = results[last_year]['principal']
            
            # Check if portfolio depletes
            if final_balance <= 0:
                recommendations.append("⚠️ CRITICAL: Portfolio may deplete before retirement period ends.")
                recommendations.append("Consider reducing withdrawal rate or increasing initial savings.")
            elif final_balance < initial_balance * 0.5:
                recommendations.append("⚠️ WARNING: Portfolio may decline significantly.")
                recommendations.append("Consider adjusting withdrawal strategy or increasing savings.")
            else:
                recommendations.append("✅ Portfolio appears sustainable for the retirement period.")
            
            # Analyze withdrawal rate
            withdrawal_rate = parameters.get('draw', 0)
            if withdrawal_rate > 0.05:
                recommendations.append("⚠️ High withdrawal rate detected (>5%). Consider reducing to improve sustainability.")
            elif withdrawal_rate < 0.03:
                recommendations.append("ℹ️ Conservative withdrawal rate. You may be able to withdraw more safely.")
        
        elif simulation_type == 'monte_carlo':
            # Analyze Monte Carlo results
            success_rates = results.get('success_rates', [])
            if success_rates:
                avg_success_rate = np.mean(success_rates)
                if avg_success_rate < 0.7:
                    recommendations.append("⚠️ Low success rate in Monte Carlo analysis.")
                    recommendations.append("Consider reducing withdrawal rate or increasing savings.")
                elif avg_success_rate > 0.9:
                    recommendations.append("✅ High success rate indicates good retirement plan.")
                else:
                    recommendations.append("ℹ️ Moderate success rate. Consider fine-tuning your strategy.")
        
        # General recommendations
        recommendations.append("📊 Consider running multiple scenarios to test different strategies.")
        recommendations.append("🔄 Review and update your plan annually as circumstances change.")
        recommendations.append("💡 Consult with a financial advisor for personalized advice.")
        
        return recommendations
    
    def _render_basic_simulation(self, story, sim_data, client_name):
        """Helper to render a single basic simulation section."""
        parameters = sim_data.get('parameters', {})
        results = sim_data.get('results', {})

        story.append(Paragraph(f"Basic Simulation from: {sim_data.get('created_at', 'N/A')}", self.subsection_style))
        story.append(Spacer(1, 12))

        # ... (Add parameter and summary tables here, similar to original)

        # Add detailed results table if present
        if results:
            story.append(Paragraph("Detailed Results by Year", self.subsection_style))
            sorted_years = sorted(results.keys(), key=lambda x: int(x.split('-')[1]))
            detailed_data = [["Year", "Principal", "Income (Pre-Tax)", "Real Income (Post-Tax)", "Projected Spend", "Surplus", "Status"]]
            for year in sorted_years:
                data = results[year]
                detailed_data.append([
                    year, self.format_currency(data.get('principal')), self.format_currency(data.get('income')),
                    self.format_currency(data.get('real_income cap')), self.format_currency(data.get('projected_spend')),
                    self.format_currency(data.get('surplus')), str(data.get('status', ''))
                ])
            detailed_table = Table(detailed_data, colWidths=[0.8*inch, 1*inch, 1*inch, 1.2*inch, 1*inch, 1*inch, 1*inch])
            detailed_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
            ]))
            story.append(detailed_table)
            story.append(Spacer(1, 12))

        # Add chart
        principal_buffer, income_buffer = self.create_retirement_chart(results, client_name)
        if principal_buffer and income_buffer:
            img_principal = Image(principal_buffer, width=6*inch, height=4*inch)
            img_income = Image(income_buffer, width=6*inch, height=4*inch)
            story.append(img_principal)
            story.append(img_income)
        story.append(Spacer(1, 24))

    def _render_mc_simulation(self, story, sim_data):
        """Helper to render a single Monte Carlo simulation section."""
        parameters = sim_data.get('parameters', {})
        results = sim_data.get('results', {})
        success_rates = results.get('success_rates', [])

        story.append(Paragraph(f"Monte Carlo Scenario from: {sim_data.get('created_at', 'N/A')}", self.subsection_style))
        story.append(Spacer(1, 12))

        # Add parameter table
        param_data = [["Parameter", "Value"]]
        for k, v in parameters.items():
            param_data.append([str(k), str(v)])
        param_table = Table(param_data, colWidths=[2*inch, 3*inch])
        param_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
        story.append(param_table)
        story.append(Spacer(1, 8))

        # Add summary table
        if success_rates:
            avg_success = np.mean(success_rates) * 100
            min_success = np.min(success_rates) * 100
            max_success = np.max(success_rates) * 100
            summary_data = [
                ["Average Success Rate", f"{avg_success:.1f}%"],
                ["Best Year Success Rate", f"{max_success:.1f}%"],
                ["Worst Year Success Rate", f"{min_success:.1f}%"]
            ]
            summary_table = Table(summary_data, colWidths=[2.5*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e3eaf2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 8))

        # Add chart
        if success_rates:
            target_rate = parameters.get('target_success_rate', 0.9)
            chart_buffer = self.create_monte_carlo_chart(success_rates, target_rate)
            if chart_buffer:
                img = Image(chart_buffer, width=6*inch, height=4*inch)
                story.append(img)
        story.append(Spacer(1, 24))

    def create_report(self, client_data, simulations):
        """Create a consolidated PDF report for a client."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        story = []
        # Title page and Client Info
        story.append(Paragraph("Retirement Simulation Report", self.title_style))
        story.append(Paragraph(f"For: {client_data.get('name', 'N/A')}", self.title_style))
        story.append(Spacer(1, 20))
        # Add client info table
        client_info_data = [
            ["Name", client_data.get('name', 'N/A')],
            ["Age", client_data.get('age', 'N/A')],
            ["Date Created", client_data.get('date_created', client_data.get('created_at', 'N/A'))],
            ["User ID", client_data.get('user_id', 'N/A')],
        ]
        client_info_table = Table(client_info_data, colWidths=[1.5*inch, 3*inch])
        client_info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e3eaf2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(client_info_table)
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", self.normal_style))
        story.append(PageBreak())
        # Accept both 'monte_carlo' and 'monteCarlo' as MC types
        basic_sims = [s for s in simulations if s.get('type') == 'basic']
        mc_sims = [s for s in simulations if s.get('type') in ('monte_carlo', 'monteCarlo')]
        # Section 1: Basic Simulations
        if basic_sims:
            story.append(Paragraph("Section 1: Basic Simulation Analysis", self.section_style))
            for sim in basic_sims:
                sim_data = sim.get('data', sim)
                self._render_basic_simulation(story, sim_data, client_data.get('name', 'Client'))
        # Section 2: Monte Carlo Scenarios
        if mc_sims:
            story.append(PageBreak())
            story.append(Paragraph("Section 2: Monte Carlo Scenarios", self.section_style))
            for sim in mc_sims:
                sim_data = sim.get('data', sim)
                self._render_mc_simulation(story, sim_data)
        # --- INSIGHTS/RECOMMENDATIONS SECTION (now deduplicated) ---
        if basic_sims or mc_sims:
            story.append(PageBreak())
            story.append(Paragraph("Insights & Recommendations", self.section_style))
            all_recs = []
            for sim in basic_sims:
                sim_data = sim.get('data', sim)
                recs = self.generate_recommendations(sim_data.get('results', {}), 'basic', sim_data.get('parameters', {}))
                all_recs.extend(recs)
            for sim in mc_sims:
                sim_data = sim.get('data', sim)
                recs = self.generate_recommendations(sim_data.get('results', {}), 'monte_carlo', sim_data.get('parameters', {}))
                all_recs.extend(recs)
            # Deduplicate while preserving order
            seen = set()
            unique_recs = []
            for rec in all_recs:
                if rec not in seen:
                    unique_recs.append(rec)
                    seen.add(rec)
            for rec in unique_recs:
                story.append(Paragraph(rec, self.normal_style))
        doc.build(story)
        buffer.seek(0)
        return buffer

def generate_retirement_report(client_data, simulations):
    """Generate a consolidated retirement simulation PDF report for a client."""
    generator = RetirementReportGenerator()
    return generator.create_report(client_data, simulations) 