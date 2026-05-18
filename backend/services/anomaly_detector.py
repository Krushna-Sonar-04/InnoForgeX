def detect_anomaly(data):

    amount = data.get("amount", 0)

    if amount > 200000:
        return True

    return False