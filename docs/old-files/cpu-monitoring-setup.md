---
title: CPU Performance Monitoring Setup
tags: [linux, bash, monitoring, troubleshooting]
---

# PROBLEM
Lüfter-Lüfter гән starts every ~5 minutes. Need continuous long-term logging to capture rare spike events caused by high CPU usage and heat generation.

# LÖSUNG
1. Created Bash-based monitoring script using ps, /proc/stat, and thermal sensors
2. Log timestamp, CPU percentage, temperature, and top 10 processes every 30 seconds
3. Run in background with nohup for persistent logging across sessions
4. Store logs in dated files for easy analysis of time-based spikes

# CODE / COMMANDS

```bash
# Create logs directory and start monitoring
mkdir -p scripts/logs
cd scripts
cat > cpu-monitor.sh << 'EOF'
#!/bin/bash
INTERVAL=${1:-30}
LOGDIR="logs"
LOGFILE="cpu-usage-$(date +%Y-%m-%d).log"
mkdir -p "$LOGDIR"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    # CPU calculation from /proc/stat
    PREV_CPU=$(cat /proc/stat | grep '^cpu ' | awk '{print $2+$3+$4+$7+$8}')
    PREV_IDLE=$(cat /proc/stat | grep '^cpu ' | awk '{print $5}')
    TOTAL_PREV=$((PREV_CPU + PREV_IDLE))
    
    sleep 0.1
    
    CURR_CPU=$(cat /proc/stat | grep '^cpu ' | awk '{print $2+$3+$4+$7+$8}')
    CURR_IDLE=$(cat /proc/stat | grep '^cpu ' | awk '{print $5}')
    TOTAL_CURR=$((CURR_CPU + CURR_IDLE))
    
    DIFF_IDLE=$((CURR_IDLE - PREV_IDLE))
    DIFF_TOTAL=$((TOTAL_CURR - TOTAL_PREV))
    CPU_USAGE=$((100 * (DIFF_TOTAL - DIFF_IDLE) / DIFF_TOTAL))
    
    # Temperature from thermal_zone
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        TEMP="$(($(cat /sys/class/thermal/thermal_zone0/temp) / 1000))C"
    else
        TEMP="N/A"
    fi
    
    # Top processes
    PROCESSES=$(ps aux --sort=-%cpu | head -11 | tail -10 | awk '{printf "%s|%.1f", substr($11,1,15), $3}')
    
    echo "$TIMESTAMP|${CPU_USAGE}%|$TEMP|$PROCESSES" >> "$LOGDIR/$LOGFILE"
    
    [ $CPU_USAGE -gt 70 ] && echo "HIGH CPU: ${CPU_USAGE}% at $TIMESTAMP"
    sleep $INTERVAL
done
EOF

chmod +x cpu-monitor.sh
nohup ./cpu-monitor.sh > logs/monitorBackground.log 2>&1 &
```


# SHELL OUTPUT / ERROR
N/A

# WEITERE RESOURCES
- Log files: `scripts/logs/cpu-usage-YYYY-MM-DD.log`
- Linux /proc/stat documentation for CPU calculation
- thermal_zone path: `/sys/class/thermal/thermal_zone0/temp`