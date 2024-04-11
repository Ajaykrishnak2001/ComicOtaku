(async function ($) {
    "use strict";

    if ($('#myChart').length) {
        const ctx = document.getElementById('myChart').getContext('2d');
        const res = await fetch('/admin/dailychart', {
            method: 'post'
        });
        const {val, xaxis} = await res.json();
        let chart = daily(ctx, val, xaxis);

        const selectionElement = document.getElementById('selection');

        selectionElement.addEventListener('change', async function () {
            const option = this.value;

            if (chart) {
                chart.destroy();
            }

            if (option === 'Daily') {
                const res = await fetch('/admin/dailychart', {
                    method: 'post'
                });
                const {val, xaxis} = await res.json();
                chart = await daily(ctx, val, xaxis); // Await chart creation
            } else if (option === 'Monthly') {
                const res = await fetch('/admin/monthlychart', {
                    method: 'post'
                });
                const {val, xaxis} = await res.json();
                chart = await monthly(ctx, val, xaxis); // Await chart creation
            }
        });


    } //End if


})(jQuery);

function daily(ctx,val,xaxis){
    // Handle the case when "Daily" is selected
    return new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',
        
        // The data for our dataset
        data: {
            labels: [...xaxis],
            datasets: [{
                    label: 'Revenue',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(44, 120, 220, 0.2)',
                    borderColor: 'rgba(44, 120, 220)',
                    data: [...val]
                }
            ]
        },
        options: {
            plugins: {
            legend: {
                labels: {
                usePointStyle: true,
                },
            }
            }
        }
    });
}

async function monthly(ctx,val,xaxis){
    
    return new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        
        // The data for our dataset
        data: {
            labels: [...xaxis],
            datasets: [{
                    label: 'Revenue',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(44, 120, 220, 0.2)',
                    borderColor: 'rgba(44, 120, 220)',
                    data: [...val]
                }
            ]
        },
        options: {
            plugins: {
            legend: {
                labels: {
                usePointStyle: true,
                },
            }
            }
        }
    });
}