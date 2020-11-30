function parse(query: string) {
    const operators: any = []
    const operands: any = []
    const priority: any = {
        "!": 3,
        "&&": 2,
        "||": 1
    }
    function operate(operator: string, a: any, b: any = 0) {
        if (a === undefined || b === undefined) {
            return { error: true }
        }
        let x = {}
        switch (operator) {
            case "||":
                x = { '$or': [a, b] }
                break;
            case "&&":
                x = { '$and': [a, b] }
                break;
            case "!":
                x = { '$nor': [a] }
                break;
        }
        return x
    }
    function x(operator: string) {
        while (operators.length > 0 && operators[operators.length - 1] !== "(" && priority[operators[operators.length - 1]] >= priority[operator]) {
            const last_operator = operators.pop()
            if (last_operator !== "!") {
                const b = operands.pop()
                const a = operands.pop()
                operands.push(operate(last_operator, a, b))
            } else {
                const a = operands.pop()
                operands.push(operate(last_operator, a))
            }
        }
        operators.push(operator)
    }

    function execute_until_opening_bracket() {
        while (operators.length > 0) {
            const last_operator = operators.pop()
            if (last_operator === "(") {
                break;
            }
            if (last_operator !== "!") {
                const b = operands.pop()
                const a = operands.pop()
                operands.push(operate(last_operator, a, b))
            } else {
                const a = operands.pop()
                operands.push(operate(last_operator, a))
            }
        }
    }
    function execute_remaining() {
        while (operators.length > 0) {
            const last_operator = operators.pop()
            if (last_operator === ")" || last_operator === "(") {
                continue;
            }
            if (last_operator !== "!") {
                const b = operands.pop()
                const a = operands.pop()
                operands.push(operate(last_operator, a, b))
            } else {
                const a = operands.pop()
                operands.push(operate(last_operator, a))
            }
        }
    }
    function detect_brackets(str: string) {
        const tokens = ["&&", "||", "!", ",", "-"]
        const tokens2 = ["&&", "||", "!", "(", ")", ",", "-"]
        const stack = []
        const closing_brackets = []
        const opening_brackets = []
        for (let i = 0; i < str.length; i++) {
            if (tokens2.includes(str[i])) {
                stack.push({ token: str[i], idx: i })
            }
            if (str[i + 1] && tokens2.includes(str[i] + str[i + 1])) {
                stack.push({ token: str[i] + str[i + 1], idx: i })
            }
            if (str[i] === ")") {
                let x: any = stack.pop()
                let m = false
                while (x.token !== "(") {
                    x = stack.pop()
                    if (tokens.includes(x.token)) {
                        m = true
                    }
                }
                if (!m && (x.idx > 0 && (tokens.includes(str[x.idx - 1])) || (str[x.idx - 2] && tokens.includes(str[x.idx - 2] + str[x.idx - 1]))) ||
                    (x.idx === 0)) {
                    closing_brackets.push(i)
                    opening_brackets.push(x.idx)
                } else if (m) {
                    closing_brackets.push(i)
                    opening_brackets.push(x.idx)
                }
            }
        }
        const arr = str.split("")
        for (let i = 0; i < closing_brackets.length; i++) {
            arr[opening_brackets[i]] = "(%"
            arr[closing_brackets[i]] = "%)"
        }
        str = arr.join("")
        return str
    }


    function split(str: any) {
        const tokens = ["&&", "||", "!", "(%", "%)", ",", "-"]
        const temp_char = "#$#"
        str = detect_brackets(str)
        console.log(str)
        for (const token of tokens) {
            str = str.replaceAll(token, temp_char + token + temp_char)
        }
        const arr = str.split(temp_char).map((el: any) => el.trim()).filter((el: any) => el !== "")
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === "(%") {
                arr[i] = "("
            }
            if (arr[i] === "%)") {
                arr[i] = ")"
            }
        }
        return arr;
    }

    const query_splitted = split(query)
    for (const word of query_splitted) {
        switch (word) {
            case "||":
                x("||")
                break;
            case ",":
            case "&&":
                x("&&")
                break;
            case "-":
            case "!":
                x("!")
                break;
            case "(":
                operators.push("(")
                break;
            case ")":
                execute_until_opening_bracket()
                break;
            default:
                operands.push({ tags: word })
                break;
        }
    }
    execute_remaining()
    if (operands.length !== 1 || operators.length !== 0) {
        return { error: true }
    } else {
        return operands[0]
    }
}