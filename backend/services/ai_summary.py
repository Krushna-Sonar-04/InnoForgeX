def generate_ai_summary(reasons):

    if not reasons:
        return "No suspicious activity detected."

    summary = "This claim appears suspicious because "

    summary += ", ".join(reasons)

    return summary